/**
 * Stripe Integration Test Suite
 * Tests for payment processing, webhook handling, and subscription management
 */

const request = require('supertest');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
const app = require('../server');

const prisma = new PrismaClient();

// Test configuration
const TEST_CONFIG = {
  testCard: {
    success: 'tok_visa',
    decline: 'tok_chargeDeclined',
    insufficientFunds: 'tok_chargeDeclinedInsufficientFunds',
    expired: 'tok_chargeDeclinedExpiredCard',
    processing: 'tok_chargeDeclinedProcessingError'
  },
  testAmounts: {
    small: 500, // $5.00
    medium: 5000, // $50.00
    large: 50000 // $500.00
  }
};

describe('Stripe Payment Integration', () => {
  let testUser;
  let testProject;
  let authToken;

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test@impactlink.com',
        password: 'hashedPassword123',
        firstName: 'Test',
        lastName: 'User',
        role: 'DONOR'
      }
    });

    // Create test charity
    const testCharity = await prisma.charity.create({
      data: {
        name: 'Test Charity',
        description: 'For testing purposes',
        category: 'EDUCATION',
        verificationStatus: 'VERIFIED',
        email: 'charity@test.com'
      }
    });

    // Create test project
    testProject = await prisma.project.create({
      data: {
        title: 'Test Project',
        description: 'Testing donations',
        targetAmount: 10000,
        currentAmount: 0,
        charityId: testCharity.id,
        status: 'ACTIVE'
      }
    });

    // Mock auth token (adjust based on your JWT implementation)
    authToken = 'Bearer test_token';
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.donation.deleteMany({ where: { userId: testUser.id } });
    await prisma.project.deleteMany({ where: { id: testProject.id } });
    await prisma.charity.deleteMany({ where: { email: 'charity@test.com' } });
    await prisma.user.deleteMany({ where: { email: 'test@impactlink.com' } });
    await prisma.$disconnect();
  });

  describe('Payment Intent Creation', () => {
    test('should create payment intent for valid donation', async () => {
      const response = await request(app)
        .post('/api/donations/intent')
        .set('Authorization', authToken)
        .send({
          amount: TEST_CONFIG.testAmounts.small,
          projectId: testProject.id,
          paymentMethod: 'CREDIT_CARD'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('clientSecret');
      expect(response.body).toHaveProperty('paymentIntentId');
    });

    test('should reject payment intent with invalid amount', async () => {
      const response = await request(app)
        .post('/api/donations/intent')
        .set('Authorization', authToken)
        .send({
          amount: -100,
          projectId: testProject.id,
          paymentMethod: 'CREDIT_CARD'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject payment intent for inactive project', async () => {
      const inactiveProject = await prisma.project.create({
        data: {
          title: 'Inactive Project',
          description: 'Testing',
          targetAmount: 5000,
          currentAmount: 0,
          charityId: testProject.charityId,
          status: 'COMPLETED'
        }
      });

      const response = await request(app)
        .post('/api/donations/intent')
        .set('Authorization', authToken)
        .send({
          amount: TEST_CONFIG.testAmounts.small,
          projectId: inactiveProject.id,
          paymentMethod: 'CREDIT_CARD'
        });

      expect(response.status).toBe(400);
      await prisma.project.delete({ where: { id: inactiveProject.id } });
    });
  });

  describe('Payment Confirmation', () => {
    test('should confirm successful payment', async () => {
      // Create payment intent
      const intentResponse = await request(app)
        .post('/api/donations/intent')
        .set('Authorization', authToken)
        .send({
          amount: TEST_CONFIG.testAmounts.small,
          projectId: testProject.id,
          paymentMethod: 'CREDIT_CARD'
        });

      const { paymentIntentId } = intentResponse.body;

      // Simulate Stripe confirmation (in test environment)
      const response = await request(app)
        .post('/api/donations/confirm')
        .set('Authorization', authToken)
        .send({
          paymentIntentId,
          projectId: testProject.id
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('donation');
      expect(response.body.donation.status).toBe('COMPLETED');
    });

    test('should handle declined payment', async () => {
      const response = await request(app)
        .post('/api/donations/confirm')
        .set('Authorization', authToken)
        .send({
          paymentIntentId: 'pi_declined_test',
          projectId: testProject.id
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('declined');
    });
  });

  describe('Recurring Donations', () => {
    test('should create recurring donation subscription', async () => {
      const response = await request(app)
        .post('/api/donations/recurring')
        .set('Authorization', authToken)
        .send({
          amount: TEST_CONFIG.testAmounts.medium,
          projectId: testProject.id,
          frequency: 'MONTHLY',
          paymentMethod: 'CREDIT_CARD'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('subscription');
      expect(response.body.subscription.frequency).toBe('MONTHLY');
    });

    test('should cancel recurring donation', async () => {
      // Create recurring donation first
      const createResponse = await request(app)
        .post('/api/donations/recurring')
        .set('Authorization', authToken)
        .send({
          amount: TEST_CONFIG.testAmounts.small,
          projectId: testProject.id,
          frequency: 'WEEKLY',
          paymentMethod: 'CREDIT_CARD'
        });

      const subscriptionId = createResponse.body.subscription.id;

      // Cancel it
      const cancelResponse = await request(app)
        .delete(`/api/donations/recurring/${subscriptionId}`)
        .set('Authorization', authToken);

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.message).toContain('cancelled');
    });
  });

  describe('Webhook Processing', () => {
    test('should process payment_intent.succeeded webhook', async () => {
      const webhookEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            amount: TEST_CONFIG.testAmounts.small,
            status: 'succeeded',
            metadata: {
              userId: testUser.id,
              projectId: testProject.id
            }
          }
        }
      };

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .send(webhookEvent);

      expect(response.status).toBe(200);
      
      // Verify donation was created
      const donation = await prisma.donation.findFirst({
        where: {
          stripePaymentIntentId: 'pi_test_123'
        }
      });

      expect(donation).toBeTruthy();
      expect(donation.status).toBe('COMPLETED');
    });

    test('should process payment_intent.payment_failed webhook', async () => {
      const webhookEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_failed',
            amount: TEST_CONFIG.testAmounts.small,
            status: 'failed',
            metadata: {
              userId: testUser.id,
              projectId: testProject.id
            },
            last_payment_error: {
              message: 'Card declined'
            }
          }
        }
      };

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .send(webhookEvent);

      expect(response.status).toBe(200);

      // Verify donation status
      const donation = await prisma.donation.findFirst({
        where: {
          stripePaymentIntentId: 'pi_test_failed'
        }
      });

      expect(donation).toBeTruthy();
      expect(donation.status).toBe('FAILED');
    });

    test('should process charge.refunded webhook', async () => {
      // Create a successful donation first
      const donation = await prisma.donation.create({
        data: {
          amount: TEST_CONFIG.testAmounts.small,
          status: 'COMPLETED',
          userId: testUser.id,
          projectId: testProject.id,
          paymentMethod: 'CREDIT_CARD',
          stripePaymentIntentId: 'pi_refund_test'
        }
      });

      const webhookEvent = {
        type: 'charge.refunded',
        data: {
          object: {
            payment_intent: 'pi_refund_test',
            amount_refunded: TEST_CONFIG.testAmounts.small
          }
        }
      };

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .send(webhookEvent);

      expect(response.status).toBe(200);

      // Verify refund was processed
      const updatedDonation = await prisma.donation.findUnique({
        where: { id: donation.id }
      });

      expect(updatedDonation.status).toBe('REFUNDED');
    });
  });

  describe('Payout Processing', () => {
    test('should process payout to charity', async () => {
      const response = await request(app)
        .post('/api/payouts/process')
        .set('Authorization', authToken) // Admin token required
        .send({
          projectId: testProject.id,
          amount: TEST_CONFIG.testAmounts.medium
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('payout');
      expect(response.body.payout.status).toBe('PENDING');
    });

    test('should reject payout exceeding project funds', async () => {
      const response = await request(app)
        .post('/api/payouts/process')
        .set('Authorization', authToken)
        .send({
          projectId: testProject.id,
          amount: 999999999 // Exceeds available funds
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('insufficient');
    });
  });

  describe('Error Handling', () => {
    test('should handle Stripe API errors gracefully', async () => {
      const response = await request(app)
        .post('/api/donations/intent')
        .set('Authorization', authToken)
        .send({
          amount: TEST_CONFIG.testAmounts.small,
          projectId: 'invalid-project-id',
          paymentMethod: 'CREDIT_CARD'
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle network timeouts', async () => {
      // Simulate timeout by using invalid Stripe key momentarily
      process.env.STRIPE_SECRET_KEY = 'sk_test_invalid';

      const response = await request(app)
        .post('/api/donations/intent')
        .set('Authorization', authToken)
        .send({
          amount: TEST_CONFIG.testAmounts.small,
          projectId: testProject.id,
          paymentMethod: 'CREDIT_CARD'
        });

      expect(response.status).toBe(500);
      
      // Restore valid key
      process.env.STRIPE_SECRET_KEY = process.env.STRIPE_TEST_KEY;
    });
  });
});

// Helper function to simulate webhook signature
function generateWebhookSignature(payload, secret) {
  const crypto = require('crypto');
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${JSON.stringify(payload)}`)
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

module.exports = {
  TEST_CONFIG,
  generateWebhookSignature
};

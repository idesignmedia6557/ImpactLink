# Stripe Integration Testing Guide

## Overview
This guide provides comprehensive instructions for testing Stripe payment integration in the ImpactLink platform, including payment processing, webhooks, and recurring donations.

## Prerequisites

### 1. Stripe Test Account Setup
- Create a Stripe test account at https://stripe.com
- Navigate to Developers > API keys
- Copy your **Test Publishable Key** and **Test Secret Key**
- Add keys to your `.env` file:

```bash
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 2. Install Testing Dependencies
```bash
npm install --save-dev jest supertest
```

### 3. Database Setup
Ensure PostgreSQL is running and Prisma is configured:
```bash
npx prisma migrate dev
npx prisma generate
```

---

## Stripe Test Card Numbers

Stripe provides test card numbers for different scenarios:

### Successful Payments
- **Visa**: `4242 4242 4242 4242`
- **Visa (debit)**: `4000 0566 5566 5556`
- **Mastercard**: `5555 5555 5555 4444`
- **American Express**: `3782 822463 10005`

### Declined Payments
- **Generic decline**: `4000 0000 0000 0002`
- **Insufficient funds**: `4000 0000 0000 9995`
- **Lost card**: `4000 0000 0000 9987`
- **Stolen card**: `4000 0000 0000 9979`
- **Expired card**: `4000 0000 0000 0069`
- **Incorrect CVC**: `4000 0000 0000 0127`
- **Processing error**: `4000 0000 0000 0119`

### 3D Secure Testing
- **Requires authentication**: `4000 0025 0000 3155`
- **Authentication failed**: `4000 0000 0000 9235`

### Card Details for Testing
- **Expiry Date**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

---

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Stripe Tests Only
```bash
npm test tests/stripe.test.js
```

### Run with Coverage
```bash
npm test -- --coverage
```

### Watch Mode (for development)
```bash
npm test -- --watch
```

---

## Manual Testing Workflows

### 1. Testing One-Time Donations

#### Step 1: Create Payment Intent
```bash
curl -X POST http://localhost:5000/api/donations/intent \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "projectId": "project-uuid",
    "paymentMethod": "CREDIT_CARD"
  }'
```

**Expected Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

#### Step 2: Confirm Payment (Frontend)
Use Stripe.js in your frontend:
```javascript
const result = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: {
      name: 'Test User'
    }
  }
});
```

#### Step 3: Verify in Database
```sql
SELECT * FROM "Donation" WHERE "stripePaymentIntentId" = 'pi_xxx';
```

### 2. Testing Recurring Donations

#### Create Recurring Donation
```bash
curl -X POST http://localhost:5000/api/donations/recurring \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 2500,
    "projectId": "project-uuid",
    "frequency": "MONTHLY",
    "paymentMethod": "CREDIT_CARD"
  }'
```

#### Cancel Recurring Donation
```bash
curl -X DELETE http://localhost:5000/api/donations/recurring/SUBSCRIPTION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Testing Webhooks Locally

#### Install Stripe CLI
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_amd64.tar.gz
tar -xvf stripe_linux_amd64.tar.gz
```

#### Forward Webhooks to Local Server
```bash
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

**Copy the webhook signing secret** displayed and add to `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

#### Trigger Test Events
```bash
# Successful payment
stripe trigger payment_intent.succeeded

# Failed payment
stripe trigger payment_intent.payment_failed

# Refund
stripe trigger charge.refunded

# Subscription created
stripe trigger customer.subscription.created

# Subscription cancelled
stripe trigger customer.subscription.deleted
```

---

## Testing Scenarios

### Scenario 1: Successful Donation Flow
1. User creates donation with valid card (4242...)
2. Payment intent is created
3. Payment is confirmed
4. Webhook fires `payment_intent.succeeded`
5. Donation status updated to `COMPLETED`
6. Project `currentAmount` is incremented
7. User receives confirmation email
8. Charity receives notification

**Verification:**
- Check database: `Donation.status === 'COMPLETED'`
- Check project funds increased
- Check email logs

### Scenario 2: Declined Payment
1. User submits donation with declined card (4000...0002)
2. Payment intent created
3. Payment confirmation fails
4. Webhook fires `payment_intent.payment_failed`
5. Donation status is `FAILED`
6. User receives error message
7. No funds added to project

**Verification:**
- Check database: `Donation.status === 'FAILED'`
- Check project funds unchanged
- Check error logs

### Scenario 3: Refund Processing
1. Admin initiates refund in Stripe Dashboard
2. Webhook fires `charge.refunded`
3. Donation status updated to `REFUNDED`
4. Project funds are decremented
5. User receives refund notification

**Verification:**
- Check database: `Donation.status === 'REFUNDED'`
- Check project `currentAmount` decreased
- Check refund notification sent

### Scenario 4: Recurring Donation Lifecycle
1. User creates monthly recurring donation
2. Stripe subscription is created
3. First charge processes immediately
4. Webhook fires `invoice.payment_succeeded` monthly
5. New donation record created each billing cycle
6. User can cancel anytime
7. Webhook fires `customer.subscription.deleted`

**Verification:**
- Check database: `RecurringDonation.active === true`
- Check multiple donation records created
- Check subscription ID stored

---

## Webhook Events to Test

### Payment Events
- ✅ `payment_intent.succeeded` - Payment successful
- ✅ `payment_intent.payment_failed` - Payment declined
- ✅ `payment_intent.processing` - Payment processing
- ✅ `payment_intent.canceled` - Payment canceled

### Charge Events
- ✅ `charge.succeeded` - Charge successful
- ✅ `charge.failed` - Charge failed
- ✅ `charge.refunded` - Refund processed
- ✅ `charge.dispute.created` - Dispute filed

### Subscription Events
- ✅ `customer.subscription.created` - Subscription started
- ✅ `customer.subscription.updated` - Subscription changed
- ✅ `customer.subscription.deleted` - Subscription cancelled
- ✅ `invoice.payment_succeeded` - Recurring payment successful
- ✅ `invoice.payment_failed` - Recurring payment failed

---

## Common Issues & Solutions

### Issue 1: Webhook Signature Verification Failed
**Cause**: Incorrect webhook secret
**Solution**: 
- Run `stripe listen` to get new secret
- Update `STRIPE_WEBHOOK_SECRET` in `.env`
- Restart server

### Issue 2: Payment Intent Already Confirmed
**Cause**: Duplicate confirmation attempt
**Solution**:
- Check for payment intent idempotency
- Ensure frontend doesn't retry automatically
- Add unique key to payment intent metadata

### Issue 3: Test Mode vs Live Mode Mismatch
**Cause**: Using live key with test data
**Solution**:
- Verify all keys have `_test_` prefix
- Check Stripe Dashboard mode toggle
- Use separate databases for test/live

### Issue 4: 3D Secure Not Working
**Cause**: Test card doesn't require authentication
**Solution**:
- Use card `4000 0025 0000 3155`
- Implement Stripe.js `handleCardAction()`
- Test with Stripe's test authentication flow

---

## Performance Testing

### Load Testing Payment Processing
```bash
# Install artillery
npm install -g artillery

# Create artillery.yml
config:
  target: "http://localhost:5000"
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "Create Payment Intent"
    flow:
      - post:
          url: "/api/donations/intent"
          headers:
            Authorization: "Bearer {{token}}"
          json:
            amount: 1000
            projectId: "{{projectId}}"

# Run test
artillery run artillery.yml
```

---

## Security Testing Checklist

- [ ] Payment amounts cannot be negative
- [ ] User cannot donate to inactive projects
- [ ] Webhook signatures are verified
- [ ] Card numbers are never stored
- [ ] Only Stripe IDs are stored in database
- [ ] JWT tokens are required for donations
- [ ] Rate limiting is enforced
- [ ] HTTPS is enforced in production
- [ ] Sensitive data is logged securely
- [ ] Refunds require admin authorization

---

## Monitoring & Logging

### Check Payment Logs
```bash
tail -f logs/payments.log | grep "payment_intent"
```

### Check Webhook Logs
```bash
tail -f logs/webhooks.log | grep "stripe"
```

### View Stripe Dashboard
- Payments: https://dashboard.stripe.com/test/payments
- Webhooks: https://dashboard.stripe.com/test/webhooks
- Logs: https://dashboard.stripe.com/test/logs

---

## CI/CD Integration

Add to `.github/workflows/test.yml`:
```yaml
name: Stripe Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run Stripe tests
        env:
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_KEY }}
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
        run: npm test tests/stripe.test.js
```

---

## Production Checklist

Before going live:

- [ ] Replace test keys with live keys
- [ ] Configure live webhook endpoint
- [ ] Test with real low-amount transactions
- [ ] Verify webhook signature in production
- [ ] Enable fraud detection rules in Stripe
- [ ] Set up payment failure notifications
- [ ] Configure automatic subscription retries
- [ ] Test refund workflow
- [ ] Verify tax calculation (if applicable)
- [ ] Enable 3D Secure for required regions
- [ ] Document disaster recovery procedures

---

## Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhook Guide](https://stripe.com/docs/webhooks)
- [Stripe CLI Reference](https://stripe.com/docs/stripe-cli)
- [PCI Compliance Guide](https://stripe.com/docs/security)

---

## Support

For issues or questions:
- Check Stripe Dashboard logs
- Review application logs in `logs/` directory
- Contact team lead or technical support
- Consult Stripe support: https://support.stripe.com

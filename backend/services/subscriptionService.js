const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const prisma = require('../config/prisma');
const logger = require('./logger');
const emailService = require('./emailService');

/**
 * Subscription Service for ImpactLink
 * Step 10 - Advanced Features: Recurring Donations
 * Handles Stripe subscription management for recurring donations
 */

class SubscriptionService {
  /**
   * Create a new subscription
   * @param {number} userId - User ID
   * @param {number} projectId - Project ID
   * @param {number} amount - Donation amount
   * @param {string} frequency - 'monthly', 'quarterly', or 'annual'
   * @param {string} paymentMethodId - Stripe payment method ID
   */
  async createSubscription(userId, projectId, amount, frequency, paymentMethodId) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const project = await prisma.project.findUnique({ 
        where: { id: projectId },
        include: { charity: true }
      });

      if (!user || !project) {
        throw new Error('User or project not found');
      }

      // Create or get Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          payment_method: paymentMethodId,
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
        stripeCustomerId = customer.id;
        
        // Update user with Stripe customer ID
        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId }
        });
      }

      // Determine interval
      const interval = this._getStripeInterval(frequency);

      // Create Stripe subscription
      const stripeSubscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Recurring donation to ${project.title}`,
              description: `Supporting ${project.charity.name}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
            recurring: { interval },
          },
        }],
        metadata: {
          userId: userId.toString(),
          projectId: projectId.toString(),
          charityId: project.charityId.toString(),
        },
      });

      // Calculate next payment date
      const nextPaymentDate = new Date(stripeSubscription.current_period_end * 1000);

      // Save subscription to database
      const subscription = await prisma.subscription.create({
        data: {
          userId,
          projectId,
          amount,
          frequency,
          stripeSubscriptionId: stripeSubscription.id,
          status: 'active',
          nextPaymentDate,
        },
      });

      // Send confirmation email
      await emailService.sendEmail(
        user.email,
        'Recurring Donation Confirmed',
        `Your ${frequency} donation of $${amount} to ${project.title} has been set up successfully.`
      );

      logger.info(`Subscription created: ${subscription.id} for user ${userId}`);
      return subscription;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Get user subscriptions
   */
  async getUserSubscriptions(userId) {
    try {
      return await prisma.subscription.findMany({
        where: { userId },
        include: {
          project: {
            include: {
              charity: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      logger.error('Error fetching subscriptions:', error);
      throw error;
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId, userId, updates) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!subscription || subscription.userId !== userId) {
        throw new Error('Subscription not found or unauthorized');
      }

      // Update Stripe subscription if amount or frequency changed
      if (updates.amount || updates.frequency) {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId
        );

        const updateData = {};
        if (updates.amount) {
          updateData.items = [{
            id: stripeSubscription.items.data[0].id,
            price_data: {
              currency: 'usd',
              product_data: stripeSubscription.items.data[0].price.product,
              unit_amount: Math.round(updates.amount * 100),
              recurring: {
                interval: updates.frequency 
                  ? this._getStripeInterval(updates.frequency)
                  : stripeSubscription.items.data[0].price.recurring.interval
              },
            },
          }];
        }

        await stripe.subscriptions.update(
          subscription.stripeSubscriptionId,
          updateData
        );
      }

      // Update database
      return await prisma.subscription.update({
        where: { id: subscriptionId },
        data: updates
      });
    } catch (error) {
      logger.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(subscriptionId, userId) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!subscription || subscription.userId !== userId) {
        throw new Error('Subscription not found or unauthorized');
      }

      // Pause in Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        pause_collection: { behavior: 'void' }
      });

      // Update database
      return await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: 'paused' }
      });
    } catch (error) {
      logger.error('Error pausing subscription:', error);
      throw error;
    }
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(subscriptionId, userId) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!subscription || subscription.userId !== userId) {
        throw new Error('Subscription not found or unauthorized');
      }

      // Resume in Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        pause_collection: null
      });

      // Update database
      return await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: 'active' }
      });
    } catch (error) {
      logger.error('Error resuming subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId, userId) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: {
          user: true,
          project: true
        }
      });

      if (!subscription || subscription.userId !== userId) {
        throw new Error('Subscription not found or unauthorized');
      }

      // Cancel in Stripe
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

      // Update database
      const cancelled = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: 'cancelled' }
      });

      // Send cancellation email
      await emailService.sendEmail(
        subscription.user.email,
        'Subscription Cancelled',
        `Your recurring donation to ${subscription.project.title} has been cancelled.`
      );

      logger.info(`Subscription cancelled: ${subscriptionId}`);
      return cancelled;
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhookEvent(event) {
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this._handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this._handlePaymentFailed(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this._handleSubscriptionDeleted(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this._handleSubscriptionUpdated(event.data.object);
          break;
        default:
          logger.info(`Unhandled webhook event: ${event.type}`);
      }
    } catch (error) {
      logger.error('Error handling webhook:', error);
      throw error;
    }
  }

  async _handlePaymentSucceeded(invoice) {
    const subscriptionId = invoice.subscription;
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
      include: { user: true, project: true }
    });

    if (subscription) {
      // Create donation record
      await prisma.donation.create({
        data: {
          userId: subscription.userId,
          projectId: subscription.projectId,
          amount: subscription.amount,
          unitsFunded: Math.floor(subscription.amount / subscription.project.unitCost),
          paymentId: invoice.payment_intent,
          timestamp: new Date(),
          status: 'completed',
          recurring: true
        }
      });

      // Update next payment date
      const nextDate = new Date(invoice.period_end * 1000);
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { nextPaymentDate: nextDate }
      });

      // Send receipt email
      await emailService.sendEmail(
        subscription.user.email,
        'Recurring Donation Receipt',
        `Thank you! Your ${subscription.frequency} donation of $${subscription.amount} has been processed.`
      );

      logger.info(`Recurring payment succeeded for subscription ${subscription.id}`);
    }
  }

  async _handlePaymentFailed(invoice) {
    const subscriptionId = invoice.subscription;
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
      include: { user: true }
    });

    if (subscription) {
      // Send failure notification
      await emailService.sendEmail(
        subscription.user.email,
        'Payment Failed',
        `Your recurring donation payment failed. Please update your payment method.`
      );

      logger.warn(`Payment failed for subscription ${subscription.id}`);
    }
  }

  async _handleSubscriptionDeleted(stripeSubscription) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id }
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'cancelled' }
      });
    }
  }

  async _handleSubscriptionUpdated(stripeSubscription) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id }
    });

    if (subscription) {
      const nextDate = new Date(stripeSubscription.current_period_end * 1000);
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { 
          nextPaymentDate: nextDate,
          status: stripeSubscription.status === 'active' ? 'active' : 'paused'
        }
      });
    }
  }

  _getStripeInterval(frequency) {
    const intervals = {
      'monthly': 'month',
      'quarterly': 'month', // Will set interval_count to 3
      'annual': 'year'
    };
    return intervals[frequency] || 'month';
  }
}

module.exports = new SubscriptionService();

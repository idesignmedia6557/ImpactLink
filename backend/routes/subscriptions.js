const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');
const { authenticate } = require('../middleware/auth');

/**
 * Subscription Routes for ImpactLink
 * Step 10 - Advanced Features: Recurring Donations
 */

// Create new subscription
router.post('/', authenticate, async (req, res) => {
  try {
    const { projectId, amount, frequency, paymentMethodId } = req.body;
    const subscription = await subscriptionService.createSubscription(
      req.user.id,
      projectId,
      amount,
      frequency,
      paymentMethodId
    );
    res.status(201).json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user subscriptions
router.get('/my-subscriptions', authenticate, async (req, res) => {
  try {
    const subscriptions = await subscriptionService.getUserSubscriptions(req.user.id);
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update subscription
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const subscription = await subscriptionService.updateSubscription(
      parseInt(req.params.id),
      req.user.id,
      req.body
    );
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pause subscription
router.post('/:id/pause', authenticate, async (req, res) => {
  try {
    const subscription = await subscriptionService.pauseSubscription(
      parseInt(req.params.id),
      req.user.id
    );
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resume subscription
router.post('/:id/resume', authenticate, async (req, res) => {
  try {
    const subscription = await subscriptionService.resumeSubscription(
      parseInt(req.params.id),
      req.user.id
    );
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const subscription = await subscriptionService.cancelSubscription(
      parseInt(req.params.id),
      req.user.id
    );
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook handler for Stripe events
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    await subscriptionService.handleWebhookEvent(event);
    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Donation = require('../models/Donation');

// Webhook endpoint - must use express.raw() for body
router.post('/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          
          // Update donation status to completed
          await Donation.findOneAndUpdate(
            { sessionId: session.id },
            {
              status: 'completed',
              paymentIntentId: session.payment_intent,
              updatedAt: new Date()
            }
          );
          
          console.log('Payment completed for session:', session.id);
          break;

        case 'checkout.session.expired':
          const expiredSession = event.data.object;
          
          // Update donation status to expired
          await Donation.findOneAndUpdate(
            { sessionId: expiredSession.id },
            {
              status: 'expired',
              updatedAt: new Date()
            }
          );
          
          console.log('Payment session expired:', expiredSession.id);
          break;

        case 'payment_intent.payment_failed':
          const paymentIntent = event.data.object;
          
          // Update donation status to failed
          await Donation.findOneAndUpdate(
            { paymentIntentId: paymentIntent.id },
            {
              status: 'failed',
              updatedAt: new Date()
            }
          );
          
          console.log('Payment failed for intent:', paymentIntent.id);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      console.error('Error processing webhook:', err);
      res.status(500).send('Webhook processing error');
    }
  }
);

module.exports = router;

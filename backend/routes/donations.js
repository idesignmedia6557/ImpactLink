const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Donation = require('../models/Donation');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateDonation = [
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be at least $1'),
  body('currency')
    .isIn(['usd', 'eur', 'gbp'])
    .withMessage('Invalid currency'),
  body('donorEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('donorName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('campaignId')
    .optional()
    .isMongoId()
    .withMessage('Invalid campaign ID'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message must not exceed 500 characters')
];

// POST /api/donations - Create new donation with Stripe
router.post('/', validateDonation, async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      amount,
      currency = 'usd',
      donorEmail,
      donorName,
      campaignId,
      message,
      paymentMethodId
    } = req.body;

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      payment_method: paymentMethodId,
      confirm: true,
      receipt_email: donorEmail,
      metadata: {
        donorName,
        campaignId: campaignId || 'general',
        message: message || ''
      },
      description: `Donation from ${donorName}`
    });

    // Create donation record
    const donation = new Donation({
      amount,
      currency,
      donorEmail,
      donorName,
      campaignId,
      message,
      stripePaymentIntentId: paymentIntent.id,
      status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
      paymentMethod: 'stripe',
      receiptUrl: paymentIntent.charges?.data[0]?.receipt_url
    });

    await donation.save();

    res.status(201).json({
      success: true,
      donation: {
        id: donation._id,
        amount: donation.amount,
        currency: donation.currency,
        status: donation.status,
        receiptUrl: donation.receiptUrl
      },
      clientSecret: paymentIntent.client_secret
    });

  } catch (error) {
    console.error('Donation error:', error);
    
    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        success: false,
        error: 'Payment failed: ' + error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process donation'
    });
  }
});

// GET /api/donations - Get all donations (with filters)
router.get('/', async (req, res) => {
  try {
    const {
      status,
      campaignId,
      donorEmail,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};
    
    if (status) query.status = status;
    if (campaignId) query.campaignId = campaignId;
    if (donorEmail) query.donorEmail = donorEmail;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const donations = await Donation.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const count = await Donation.countDocuments(query);

    res.json({
      success: true,
      donations,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });

  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve donations'
    });
  }
});

// GET /api/donations/:id - Get single donation
router.get('/:id', async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        error: 'Donation not found'
      });
    }

    res.json({
      success: true,
      donation
    });

  } catch (error) {
    console.error('Get donation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve donation'
    });
  }
});

// POST /api/donations/:id/refund - Refund a donation
router.post('/:id/refund', async (req, res) => {
  try {
    const { reason } = req.body;
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        error: 'Donation not found'
      });
    }

    if (donation.status === 'refunded') {
      return res.status(400).json({
        success: false,
        error: 'Donation already refunded'
      });
    }

    if (donation.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Only completed donations can be refunded'
      });
    }

    // Process Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: donation.stripePaymentIntentId,
      reason: reason || 'requested_by_customer',
      metadata: {
        donationId: donation._id.toString()
      }
    });

    // Update donation status
    donation.status = 'refunded';
    donation.refundId = refund.id;
    donation.refundedAt = new Date();
    await donation.save();

    res.json({
      success: true,
      donation,
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      }
    });

  } catch (error) {
    console.error('Refund error:', error);
    
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        success: false,
        error: 'Refund failed: ' + error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process refund'
    });
  }
});

// GET /api/donations/stats/summary - Get donation statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { campaignId, startDate, endDate } = req.query;
    
    const matchStage = { status: 'completed' };
    if (campaignId) matchStage.campaignId = campaignId;
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const stats = await Donation.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' },
          count: { $sum: 1 },
          currencies: { $addToSet: '$currency' }
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalAmount: 0,
        averageAmount: 0,
        count: 0,
        currencies: []
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics'
    });
  }
});

module.exports = router;

// donations.js - API routes for donation management

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const prisma = new PrismaClient();

/**
 * POST /api/donations
 * Create a new donation and process payment
 */
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      charityId,
      projectId,
      campaignId,
      amount,
      currency = 'ZAR',
      paymentMethod,
      isAnonymous = false,
      message,
      isRecurring = false,
      recurringFrequency,
      paymentMethodId, // Stripe payment method ID
    } = req.body;

    // Validate required fields
    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Amount must be at least R1' });
    }

    if (!charityId && !projectId) {
      return res.status(400).json({ error: 'Either charityId or projectId is required' });
    }

    // Verify charity exists and is verified
    if (charityId) {
      const charity = await prisma.charity.findUnique({
        where: { id: parseInt(charityId) },
      });

      if (!charity || charity.verificationStatus !== 'VERIFIED') {
        return res.status(400).json({ error: 'Charity not found or not verified' });
      }
    }

    // Verify project exists if projectId provided
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: parseInt(projectId) },
      });

      if (!project || project.status !== 'ACTIVE') {
        return res.status(400).json({ error: 'Project not found or not active' });
      }
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      payment_method: paymentMethodId,
      confirm: true,
      metadata: {
        userId: userId || 'anonymous',
        charityId: charityId || '',
        projectId: projectId || '',
        campaignId: campaignId || '',
      },
      description: `Donation to ${charityId ? 'charity' : 'project'}`,
    });

    // Create donation record
    const donation = await prisma.donation.create({
      data: {
        userId: userId ? parseInt(userId) : null,
        charityId: charityId ? parseInt(charityId) : null,
        projectId: projectId ? parseInt(projectId) : null,
        campaignId: campaignId ? parseInt(campaignId) : null,
        amount: parseFloat(amount),
        currency,
        paymentMethod: paymentMethod || 'STRIPE',
        stripePaymentIntentId: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'COMPLETED' : 'PENDING',
        isAnonymous,
        message,
      },
      include: {
        charity: {
          select: { id: true, name: true, logo: true },
        },
        project: {
          select: { id: true, title: true },
        },
      },
    });

    // Handle recurring donation setup
    if (isRecurring && userId && recurringFrequency) {
      await prisma.recurringDonation.create({
        data: {
          userId: parseInt(userId),
          charityId: charityId ? parseInt(charityId) : null,
          projectId: projectId ? parseInt(projectId) : null,
          amount: parseFloat(amount),
          currency,
          frequency: recurringFrequency,
          status: 'ACTIVE',
          nextDonationDate: calculateNextDonationDate(recurringFrequency),
          stripeSubscriptionId: paymentIntent.id, // Would use Stripe Subscription in production
        },
      });
    }

    // Create notification for user (if authenticated)
    if (userId) {
      await prisma.notification.create({
        data: {
          userId: parseInt(userId),
          type: 'DONATION_RECEIVED',
          title: 'Donation Successful',
          message: `Your donation of ${currency} ${amount} was successful`,
          link: `/donations/${donation.id}`,
        },
      });
    }

    res.status(201).json({
      success: true,
      donation,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating donation:', error);

    if (error.type === 'StripeCardError') {
      return res.status(400).json({ error: 'Payment failed: ' + error.message });
    }

    res.status(500).json({ error: 'Failed to create donation' });
  }
});

/**
 * GET /api/donations
 * Get donation history with filtering
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, charityId, projectId, page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      userId: req.user.id,
      ...(status && { status }),
      ...(charityId && { charityId: parseInt(charityId) }),
      ...(projectId && { projectId: parseInt(projectId) }),
    };

    const [donations, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        skip,
        take,
        include: {
          charity: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          project: {
            select: {
              id: true,
              title: true,
              charity: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.donation.count({ where }),
    ]);

    res.json({
      donations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

/**
 * GET /api/donations/:id
 * Get detailed donation information
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const donation = await prisma.donation.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        charity: {
          select: {
            id: true,
            name: true,
            logo: true,
            description: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    });

    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    // Check ownership or admin
    if (
      req.user.role !== 'ADMIN' &&
      donation.userId !== req.user.id
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(donation);
  } catch (error) {
    console.error('Error fetching donation:', error);
    res.status(500).json({ error: 'Failed to fetch donation' });
  }
});

/**
 * PUT /api/donations/:id/recurring
 * Update recurring donation status
 */
router.put('/:id/recurring', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'PAUSED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const recurringDonation = await prisma.recurringDonation.findUnique({
      where: { id: parseInt(id) },
    });

    if (!recurringDonation) {
      return res.status(404).json({ error: 'Recurring donation not found' });
    }

    // Check ownership
    if (recurringDonation.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.recurringDonation.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating recurring donation:', error);
    res.status(500).json({ error: 'Failed to update recurring donation' });
  }
});

/**
 * GET /api/donations/stats/summary
 * Get donation statistics (admin only)
 */
router.get('/stats/summary', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate, charityId } = req.query;

    const where = {
      status: 'COMPLETED',
      ...(charityId && { charityId: parseInt(charityId) }),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    };

    const [totalStats, donationsByCharity] = await Promise.all([
      prisma.donation.aggregate({
        where,
        _sum: { amount: true },
        _avg: { amount: true },
        _count: true,
      }),
      prisma.donation.groupBy({
        by: ['charityId'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    res.json({
      totalAmount: totalStats._sum.amount || 0,
      averageAmount: totalStats._avg.amount || 0,
      totalDonations: totalStats._count,
      donationsByCharity,
    });
  } catch (error) {
    console.error('Error fetching donation stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * Helper function to calculate next donation date
 */
function calculateNextDonationDate(frequency) {
  const now = new Date();
  switch (frequency) {
    case 'WEEKLY':
      return new Date(now.setDate(now.getDate() + 7));
    case 'MONTHLY':
      return new Date(now.setMonth(now.getMonth() + 1));
    case 'QUARTERLY':
      return new Date(now.setMonth(now.getMonth() + 3));
    case 'YEARLY':
      return new Date(now.setFullYear(now.getFullYear() + 1));
    default:
      return new Date(now.setMonth(now.getMonth() + 1));
  }
}

module.exports = router;

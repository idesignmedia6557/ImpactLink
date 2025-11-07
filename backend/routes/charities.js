// charities.js - API routes for charity management

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const prisma = new PrismaClient();

/**
 * GET /api/charities
 * Get all verified charities with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      verificationStatus: 'VERIFIED',
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [charities, total] = await prisma.$transaction([
      prisma.charity.findMany({
        where,
        skip,
        take,
        include: {
          projects: {
            where: { status: 'ACTIVE' },
            take: 3,
          },
          _count: {
            select: { donations: true, projects: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.charity.count({ where }),
    ]);

    res.json({
      charities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('Error fetching charities:', error);
    res.status(500).json({ message: 'Failed to fetch charities' });
  }
});

/**
 * GET /api/charities/:id
 * Get charity details by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const charity = await prisma.charity.findUnique({
      where: { id: parseInt(id) },
      include: {
        projects: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
        },
        campaigns: {
          where: { status: 'ACTIVE' },
        },
        impactReports: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: { 
            donations: true, 
            projects: true,
            savedBy: true,
          },
        },
      },
    });

    if (!charity) {
      return res.status(404).json({ message: 'Charity not found' });
    }

    // Calculate total donations
    const donationStats = await prisma.donation.aggregate({
      where: { charityId: parseInt(id), status: 'COMPLETED' },
      _sum: { amount: true },
      _count: true,
    });

    res.json({
      ...charity,
      totalDonations: donationStats._sum.amount || 0,
      donationCount: donationStats._count,
    });
  } catch (error) {
    console.error('Error fetching charity:', error);
    res.status(500).json({ message: 'Failed to fetch charity details' });
  }
});

/**
 * POST /api/charities
 * Register a new charity (requires authentication)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      description,
      category,
      ein,
      website,
      logoUrl,
      address,
      documents,
    } = req.body;

    // Verify user is charity admin
    if (req.user.userType !== 'CHARITY') {
      return res.status(403).json({ message: 'Only charity users can register charities' });
    }

    const charity = await prisma.charity.create({
      data: {
        name,
        email,
        phone,
        description,
        category,
        ein,
        website,
        logoUrl,
        address,
        documents,
        verificationStatus: 'PENDING',
        adminUserId: req.user.id,
      },
    });

    res.status(201).json({
      message: 'Charity registered successfully. Awaiting verification.',
      charity,
    });
  } catch (error) {
    console.error('Error creating charity:', error);
    res.status(500).json({ message: 'Failed to register charity' });
  }
});

/**
 * PUT /api/charities/:id
 * Update charity details (requires authentication and ownership)
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if charity exists and user owns it
    const charity = await prisma.charity.findUnique({
      where: { id: parseInt(id) },
    });

    if (!charity) {
      return res.status(404).json({ message: 'Charity not found' });
    }

    if (charity.adminUserId !== req.user.id && req.user.userType !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized to update this charity' });
    }

    // Don't allow verification status update via this endpoint
    delete updates.verificationStatus;
    delete updates.adminUserId;

    const updatedCharity = await prisma.charity.update({
      where: { id: parseInt(id) },
      data: updates,
    });

    res.json({
      message: 'Charity updated successfully',
      charity: updatedCharity,
    });
  } catch (error) {
    console.error('Error updating charity:', error);
    res.status(500).json({ message: 'Failed to update charity' });
  }
});

/**
 * PUT /api/charities/:id/verify
 * Verify charity (Admin only)
 */
router.put('/:id/verify', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // VERIFIED, REJECTED

    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }

    const charity = await prisma.charity.update({
      where: { id: parseInt(id) },
      data: { verificationStatus: status },
    });

    res.json({
      message: `Charity ${status.toLowerCase()} successfully`,
      charity,
    });
  } catch (error) {
    console.error('Error verifying charity:', error);
    res.status(500).json({ message: 'Failed to verify charity' });
  }
});

/**
 * POST /api/charities/:id/save
 * Save/unsave a charity (requires authentication)
 */
router.post('/:id/save', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if already saved
    const existing = await prisma.savedCharity.findUnique({
      where: {
        userId_charityId: {
          userId,
          charityId: parseInt(id),
        },
      },
    });

    if (existing) {
      // Unsave
      await prisma.savedCharity.delete({
        where: { id: existing.id },
      });
      return res.json({ message: 'Charity removed from saved list', saved: false });
    } else {
      // Save
      await prisma.savedCharity.create({
        data: {
          userId,
          charityId: parseInt(id),
        },
      });
      return res.json({ message: 'Charity saved successfully', saved: true });
    }
  } catch (error) {
    console.error('Error saving charity:', error);
    res.status(500).json({ message: 'Failed to save charity' });
  }
});

module.exports = router;

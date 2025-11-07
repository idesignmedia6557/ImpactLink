// users.js - User management routes for admin and user operations

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const prisma = new PrismaClient();

/**
 * GET /api/users
 * Get all users with filtering (admin only)
 */
router.get('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { role, isActive, search, page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      ...(role && { role }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          _count: {
            select: {
              donations: true,
              savedCharities: true,
              badges: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/users/:id
 * Get specific user details
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is viewing their own profile or is admin
    if (req.user.role !== 'ADMIN' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        bio: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            donations: true,
            savedCharities: true,
            badges: true,
            recurringDonations: true,
            notifications: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If user is viewing their own profile or admin, include more details
    if (req.user.role === 'ADMIN' || req.user.id === parseInt(id)) {
      const [donationStats, recentDonations] = await Promise.all([
        prisma.donation.aggregate({
          where: {
            userId: parseInt(id),
            status: 'COMPLETED',
          },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.donation.findMany({
          where: {
            userId: parseInt(id),
            status: 'COMPLETED',
          },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            charity: {
              select: { id: true, name: true, logo: true },
            },
            project: {
              select: { id: true, title: true },
            },
          },
        }),
      ]);

      res.json({
        ...user,
        stats: {
          totalDonated: donationStats._sum.amount || 0,
          totalDonations: donationStats._count,
        },
        recentDonations,
      });
    } else {
      res.json(user);
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * PUT /api/users/:id
 * Update user details (admin only or own profile)
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatar, bio, isActive, role } = req.body;

    // Check permissions
    if (req.user.role !== 'ADMIN' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only admins can change isActive and role
    if ((isActive !== undefined || role !== undefined) && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can change user status or role' });
    }

    const updateData = {
      ...(name && { name }),
      ...(avatar && { avatar }),
      ...(bio && { bio }),
    };

    // Admin-only fields
    if (req.user.role === 'ADMIN') {
      if (isActive !== undefined) updateData.isActive = isActive;
      if (role && ['DONOR', 'CHARITY', 'ADMIN'].includes(role)) updateData.role = role;
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        bio: true,
        isActive: true,
      },
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/users/:id
 * Deactivate user account (soft delete)
 */
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    });

    res.json({
      success: true,
      message: 'User account deactivated',
      user,
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

/**
 * GET /api/users/:id/donations
 * Get user donation history
 */
router.get('/:id/donations', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check permissions
    if (req.user.role !== 'ADMIN' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [donations, total] = await Promise.all([
      prisma.donation.findMany({
        where: { userId: parseInt(id) },
        skip,
        take,
        include: {
          charity: {
            select: { id: true, name: true, logo: true },
          },
          project: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.donation.count({ where: { userId: parseInt(id) } }),
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
    console.error('Error fetching user donations:', error);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

/**
 * GET /api/users/:id/badges
 * Get user badges and achievements
 */
router.get('/:id/badges', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const badges = await prisma.badge.findMany({
      where: { userId: parseInt(id) },
      orderBy: { awardedAt: 'desc' },
    });

    res.json({ badges });
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

/**
 * GET /api/users/:id/notifications
 * Get user notifications
 */
router.get('/:id/notifications', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { unreadOnly, page = 1, limit = 20 } = req.query;

    // Check permissions
    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      userId: parseInt(id),
      ...(unreadOnly === 'true' && { read: false }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: parseInt(id), read: false },
      }),
    ]);

    res.json({
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * PUT /api/users/:id/notifications/:notificationId/read
 * Mark notification as read
 */
router.put('/:id/notifications/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const { id, notificationId } = req.params;

    // Check permissions
    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const notification = await prisma.notification.update({
      where: { id: parseInt(notificationId) },
      data: { read: true },
    });

    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

/**
 * GET /api/users/stats/overview
 * Get platform-wide user statistics (admin only)
 */
router.get('/stats/overview', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const [totalUsers, activeUsers, usersByRole, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole,
      recentUsers,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;

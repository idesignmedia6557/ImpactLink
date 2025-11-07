// projects.js - API routes for project management

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const prisma = new PrismaClient();

/**
 * GET /api/projects
 * Get all active projects with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { charityId, category, status = 'ACTIVE', page = 1, limit = 12 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    const where = {
      status: status === 'ALL' ? undefined : status,
      ...(charityId && { charityId: parseInt(charityId) }),
      ...(category && { charity: { category } }),
    };
    
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take,
        include: {
          charity: {
            select: {
              id: true,
              name: true,
              logo: true,
              category: true,
              verificationStatus: true,
            },
          },
          _count: {
            select: {
              donations: true,
              fundAllocations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.count({ where }),
    ]);
    
    // Calculate funding progress for each project
    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {
        const totalDonations = await prisma.donation.aggregate({
          where: {
            projectId: project.id,
            status: 'COMPLETED',
          },
          _sum: { amount: true },
        });
        
        return {
          ...project,
          totalRaised: totalDonations._sum.amount || 0,
          progressPercentage: project.goalAmount
            ? Math.round(((totalDonations._sum.amount || 0) / project.goalAmount) * 100)
            : 0,
        };
      })
    );
    
    res.json({
      projects: projectsWithProgress,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

/**
 * GET /api/projects/:id
 * Get detailed project information
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        charity: {
          select: {
            id: true,
            name: true,
            logo: true,
            category: true,
            description: true,
            verificationStatus: true,
            website: true,
          },
        },
        impactReports: {
          where: { published: true },
          orderBy: { reportDate: 'desc' },
          take: 5,
        },
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        campaigns: {
          where: { status: 'ACTIVE' },
        },
        _count: {
          select: {
            donations: true,
          },
        },
      },
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get total donations and donor count
    const [donationStats, uniqueDonors] = await Promise.all([
      prisma.donation.aggregate({
        where: {
          projectId: project.id,
          status: 'COMPLETED',
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.donation.findMany({
        where: {
          projectId: project.id,
          status: 'COMPLETED',
        },
        distinct: ['userId'],
        select: { userId: true },
      }),
    ]);
    
    const projectWithStats = {
      ...project,
      totalRaised: donationStats._sum.amount || 0,
      totalDonations: donationStats._count,
      uniqueDonors: uniqueDonors.length,
      progressPercentage: project.goalAmount
        ? Math.round(((donationStats._sum.amount || 0) / project.goalAmount) * 100)
        : 0,
    };
    
    res.json(projectWithStats);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

/**
 * POST /api/projects
 * Create a new project (charity users only)
 */
router.post('/', authenticateToken, authorizeRoles('CHARITY', 'ADMIN'), async (req, res) => {
  try {
    const { charityId, title, description, goalAmount, targetDate, category, images } = req.body;
    
    // Verify charity ownership or admin
    if (req.user.role === 'CHARITY') {
      const charity = await prisma.charity.findUnique({
        where: { id: parseInt(charityId) },
      });
      
      if (!charity || charity.adminUserId !== req.user.id) {
        return res.status(403).json({ error: 'You can only create projects for your charity' });
      }
    }
    
    const project = await prisma.project.create({
      data: {
        charityId: parseInt(charityId),
        title,
        description,
        goalAmount: parseFloat(goalAmount),
        targetDate: targetDate ? new Date(targetDate) : null,
        category,
        images: images || [],
        status: 'ACTIVE',
      },
      include: {
        charity: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

/**
 * PUT /api/projects/:id
 * Update project details (charity owner or admin only)
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, goalAmount, targetDate, category, images, status } = req.body;
    
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: { charity: true },
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check ownership or admin
    if (req.user.role !== 'ADMIN' && project.charity.adminUserId !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own projects' });
    }
    
    const updatedProject = await prisma.project.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(goalAmount && { goalAmount: parseFloat(goalAmount) }),
        ...(targetDate && { targetDate: new Date(targetDate) }),
        ...(category && { category }),
        ...(images && { images }),
        ...(status && { status }),
      },
      include: {
        charity: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });
    
    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

/**
 * DELETE /api/projects/:id
 * Deactivate a project (soft delete)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: { charity: true },
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check ownership or admin
    if (req.user.role !== 'ADMIN' && project.charity.adminUserId !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own projects' });
    }
    
    // Soft delete by setting status to COMPLETED
    const updatedProject = await prisma.project.update({
      where: { id: parseInt(id) },
      data: { status: 'COMPLETED' },
    });
    
    res.json({ message: 'Project deactivated successfully', project: updatedProject });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

/**
 * GET /api/projects/:id/donations
 * Get donation history for a specific project
 */
router.get('/:id/donations', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    const [donations, total] = await Promise.all([
      prisma.donation.findMany({
        where: {
          projectId: parseInt(id),
          status: 'COMPLETED',
        },
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.donation.count({
        where: {
          projectId: parseInt(id),
          status: 'COMPLETED',
        },
      }),
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
    console.error('Error fetching project donations:', error);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

/**
 * POST /api/projects/:id/updates
 * Add an update to a project (charity owner or admin only)
 */
router.post('/:id/updates', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, images } = req.body;
    
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: { charity: true },
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check ownership or admin
    if (req.user.role !== 'ADMIN' && project.charity.adminUserId !== req.user.id) {
      return res.status(403).json({ error: 'You can only add updates to your own projects' });
    }
    
    const update = await prisma.update.create({
      data: {
        projectId: parseInt(id),
        title,
        content,
        images: images || [],
      },
    });
    
    // Create notifications for users who donated to this project
    const projectDonors = await prisma.donation.findMany({
      where: {
        projectId: parseInt(id),
        status: 'COMPLETED',
      },
      distinct: ['userId'],
      select: { userId: true },
    });
    
    // Create notifications in batch
    await prisma.notification.createMany({
      data: projectDonors.map((donor) => ({
        userId: donor.userId,
        type: 'PROJECT_UPDATE',
        title: `New update: ${title}`,
        message: `${project.charity.name} posted a new update for ${project.title}`,
        link: `/projects/${id}`,
      })),
    });
    
    res.status(201).json(update);
  } catch (error) {
    console.error('Error creating project update:', error);
    res.status(500).json({ error: 'Failed to create update' });
  }
});

module.exports = router;

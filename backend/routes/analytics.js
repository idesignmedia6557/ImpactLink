const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const { authenticate, isAdmin } = require('../middleware/auth');

// Get platform overview statistics (admin only)
router.get('/platform/overview', authenticate, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const overview = await analyticsService.getPlatformOverview(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    res.json(overview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user engagement metrics
router.get('/engagement/:userId', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const engagement = await analyticsService.getUserEngagement(
      parseInt(req.params.userId),
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    res.json(engagement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get charity performance analytics
router.get('/charity/:charityId', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const analytics = await analyticsService.getCharityAnalytics(
      parseInt(req.params.charityId),
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get project impact metrics
router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const analytics = await analyticsService.getProjectImpactMetrics(
      parseInt(req.params.projectId)
    );
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get donation trends
router.get('/donations/trends', authenticate, async (req, res) => {
  try {
    const { period, charityId } = req.query;
    const trends = await analyticsService.getDonationTrends(
      period || 'monthly',
      charityId ? parseInt(charityId) : undefined
    );
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get retention metrics (admin only)
router.get('/retention', authenticate, isAdmin, async (req, res) => {
  try {
    const { cohortDate } = req.query;
    const retention = await analyticsService.getRetentionMetrics(
      cohortDate ? new Date(cohortDate) : undefined
    );
    res.json(retention);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get custom report
router.post('/report/custom', authenticate, isAdmin, async (req, res) => {
  try {
    const { metrics, startDate, endDate, filters } = req.body;
    const report = await analyticsService.generateCustomReport(
      metrics,
      new Date(startDate),
      new Date(endDate),
      filters
    );
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

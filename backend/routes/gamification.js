const express = require('express');
const router = express.Router();
const gamificationService = require('../services/gamificationService');
const { authenticate } = require('../middleware/auth');

/**
 * Gamification Routes for ImpactLink
 * Step 10 - Advanced Features
 */

/**
 * GET /api/gamification/leaderboard
 * Get leaderboard data
 * Query params: type (donors/companies/charities), period (monthly/quarterly/all-time), limit
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { type = 'donors', period = 'all-time', limit = 10 } = req.query;
    const leaderboard = await gamificationService.getLeaderboard(
      type,
      period,
      parseInt(limit)
    );
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/gamification/achievements/:userId
 * Get user achievements and badges
 */
router.get('/achievements/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user is accessing their own data or is admin
    if (req.user.id !== parseInt(userId) && req.user.role !== 'platform_admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const achievements = await gamificationService.checkAndAwardAchievements(parseInt(userId));
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/gamification/challenges
 * Get active challenges
 */
router.get('/challenges', async (req, res) => {
  try {
    const challenges = await gamificationService.getActiveChallenges();
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/gamification/challenges/progress/:userId
 * Get user's progress on active challenges
 */
router.get('/challenges/progress/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user is accessing their own data or is admin
    if (req.user.id !== parseInt(userId) && req.user.role !== 'platform_admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const progress = await gamificationService.getUserChallengeProgress(parseInt(userId));
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

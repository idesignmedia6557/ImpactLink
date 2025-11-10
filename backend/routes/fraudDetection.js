const express = require('express');
const router = express.Router();
const fraudDetectionService = require('../services/fraudDetectionService');
const { authenticate, isAdmin } = require('../middleware/auth');

// Analyze transaction for fraud
router.post('/analyze', authenticate, async (req, res) => {
  try {
    const { transactionData } = req.body;
    const analysis = await fraudDetectionService.analyzeTransaction(transactionData);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user risk score
router.get('/risk-score/:userId', authenticate, async (req, res) => {
  try {
    const riskScore = await fraudDetectionService.getUserRiskScore(
      parseInt(req.params.userId)
    );
    res.json(riskScore);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify KYC for user
router.post('/kyc/verify', authenticate, async (req, res) => {
  try {
    const { userId, kycData } = req.body;
    const verification = await fraudDetectionService.verifyKYC(userId, kycData);
    res.json(verification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get KYC status
router.get('/kyc/status/:userId', authenticate, async (req, res) => {
  try {
    const status = await fraudDetectionService.getKYCStatus(
      parseInt(req.params.userId)
    );
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Flag suspicious activity (admin only)
router.post('/flag', authenticate, isAdmin, async (req, res) => {
  try {
    const { userId, reason, details } = req.body;
    const flag = await fraudDetectionService.flagSuspiciousActivity(
      userId,
      reason,
      details
    );
    res.json(flag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get flagged users (admin only)
router.get('/flagged', authenticate, isAdmin, async (req, res) => {
  try {
    const flaggedUsers = await fraudDetectionService.getFlaggedUsers();
    res.json(flaggedUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

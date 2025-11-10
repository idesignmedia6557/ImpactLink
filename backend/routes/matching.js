const express = require('express');
const router = express.Router();
const matchingService = require('../services/matchingService');
const { authenticate } = require('../middleware/auth');

// Get matching programs
router.get('/programs', async (req, res) => {
  try {
    const programs = await matchingService.getMatchingPrograms({
      active: req.query.active === 'true'
    });
    res.json(programs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get program details
router.get('/programs/:id', async (req, res) => {
  try {
    const program = await matchingService.getMatchingProgramById(
      parseInt(req.params.id)
    );
    res.json(program);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check eligibility for matching
router.post('/check-eligibility', authenticate, async (req, res) => {
  try {
    const { donationId, companyId } = req.body;
    const eligibility = await matchingService.checkMatchEligibility(
      donationId,
      companyId
    );
    res.json(eligibility);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process matching donation
router.post('/process', authenticate, async (req, res) => {
  try {
    const { donationId, programId } = req.body;
    const match = await matchingService.processMatchingDonation(
      donationId,
      programId,
      req.user.id
    );
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's matched donations
router.get('/my-matches', authenticate, async (req, res) => {
  try {
    const matches = await matchingService.getUserMatchedDonations(req.user.id);
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get matching statistics for company
router.get('/stats/:companyId', authenticate, async (req, res) => {
  try {
    const stats = await matchingService.getCompanyMatchingStats(
      parseInt(req.params.companyId)
    );
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

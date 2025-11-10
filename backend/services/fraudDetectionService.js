const prisma = require('../config/prisma');
const logger = require('./logger');

/**
 * Fraud Detection & KYC Service for ImpactLink
 * Step 10 - Advanced Features: Fraud Detection and KYC
 * Monitors suspicious activity and manages verification processes
 */

class FraudDetectionService {
  /**
   * Check donation for fraud indicators
   */
  async checkDonation(donationData) {
    const flags = [];
    let riskScore = 0;

    // Check velocity - rapid donations from same user
    const recentDonations = await prisma.donation.findMany({
      where: {
        userId: donationData.userId,
        timestamp: {
          gte: new Date(Date.now() - 3600000) // Last hour
        }
      }
    });

    if (recentDonations.length > 5) {
      flags.push('HIGH_VELOCITY');
      riskScore += 30;
    }

    // Check for unusually large amount
    const userAvg = await this._getUserAverageDonation(donationData.userId);
    if (userAvg && donationData.amount > userAvg * 10) {
      flags.push('LARGE_AMOUNT');
      riskScore += 20;
    }

    // Check IP address patterns (would need IP data)
    // Check for round numbers (common in testing)
    if (donationData.amount % 100 === 0 && donationData.amount >= 1000) {
      flags.push('ROUND_AMOUNT');
      riskScore += 10;
    }

    const result = {
      safe: riskScore < 50,
      riskScore,
      flags,
      requiresReview: riskScore >= 50
    };

    if (result.requiresReview) {
      await this._logFraudAlert(donationData, result);
    }

    return result;
  }

  /**
   * Verify charity KYC documents
   */
  async verifyCharityDocuments(charityId) {
    try {
      const charity = await prisma.charity.findUnique({
        where: { id: charityId }
      });

      if (!charity) throw new Error('Charity not found');

      // Check required documents
      const checks = {
        hasEIN: !!charity.ein && charity.ein.length > 0,
        hasDocuments: !!charity.documents && charity.documents.length > 0,
        ageCheck: charity.createdAt && 
          (new Date() - new Date(charity.createdAt)) > 86400000, // 24 hours old
      };

      const verified = Object.values(checks).every(c => c === true);

      return {
        charityId,
        verified,
        checks,
        nextSteps: verified ? ['Schedule interview'] : ['Upload missing documents']
      };
    } catch (error) {
      logger.error('Error verifying charity:', error);
      throw error;
    }
  }

  /**
   * Get fraud alerts for admin review
   */
  async getFraudAlerts(limit = 50) {
    try {
      return await prisma.fraudAlert.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          donation: {
            include: {
              user: true,
              project: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching fraud alerts:', error);
      throw error;
    }
  }

  async _getUserAverageDonation(userId) {
    const result = await prisma.donation.aggregate({
      where: { userId },
      _avg: { amount: true }
    });
    return result._avg.amount;
  }

  async _logFraudAlert(donationData, fraudResult) {
    try {
      await prisma.fraudAlert.create({
        data: {
          userId: donationData.userId,
          amount: donationData.amount,
          riskScore: fraudResult.riskScore,
          flags: JSON.stringify(fraudResult.flags),
          status: 'pending_review'
        }
      });
      logger.warn(`Fraud alert created for user ${donationData.userId}`);
    } catch (error) {
      logger.error('Error logging fraud alert:', error);
    }
  }
}

module.exports = new FraudDetectionService();

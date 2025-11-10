const prisma = require('../config/prisma');
const logger = require('./logger');

/**
 * Premium Analytics Service for ImpactLink
 * Step 10 - Advanced Features: Premium Analytics
 * Provides advanced analytics and insights for corporate accounts
 */

class AnalyticsService {
  /**
   * Get donor retention metrics
   */
  async getDonorRetentionMetrics(timeframe = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeframe);

      const cohorts = await this._getCohortData(cutoffDate);
      const retentionRates = this._calculateRetentionRates(cohorts);

      return {
        timeframe,
        totalDonors: cohorts.length,
        retentionRate: retentionRates.overall,
        cohortAnalysis: retentionRates.byCohort,
        repeatDonorPercentage: retentionRates.repeatDonors
      };
    } catch (error) {
      logger.error('Error calculating retention metrics:', error);
      throw error;
    }
  }

  /**
   * Get impact per dollar analysis
   */
  async getImpactPerDollar(charityId = null) {
    try {
      const where = charityId ? { project: { charityId } } : {};

      const donations = await prisma.donation.findMany({
        where,
        include: {
          project: true
        }
      });

      const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
      const totalUnits = donations.reduce((sum, d) => sum + d.unitsFunded, 0);

      return {
        totalDonations: donations.length,
        totalAmount,
        totalUnitsDelivered: totalUnits,
        averageImpactPerDollar: totalUnits / totalAmount,
        byProject: this._groupByProject(donations)
      };
    } catch (error) {
      logger.error('Error calculating impact per dollar:', error);
      throw error;
    }
  }

  /**
   * Get corporate giving analytics
   */
  async getCorporateAnalytics(corporateAccountId) {
    try {
      const company = await prisma.corporateAccount.findUnique({
        where: { id: corporateAccountId },
        include: {
          admins: {
            include: {
              donations: {
                include: {
                  project: {
                    include: {
                      charity: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!company) throw new Error('Corporate account not found');

      const allDonations = company.admins.flatMap(admin => admin.donations);
      const totalEmployees = company.admins.length;
      const activeEmployees = new Set(allDonations.map(d => d.userId)).size;

      return {
        companyName: company.companyName,
        totalEmployees,
        activeEmployees,
        participationRate: (activeEmployees / totalEmployees) * 100,
        totalDonated: allDonations.reduce((sum, d) => sum + d.amount, 0),
        averagePerEmployee: allDonations.reduce((sum, d) => sum + d.amount, 0) / activeEmployees,
        topCharities: this._getTopCharities(allDonations),
        monthlyTrend: await this._getMonthlyTrend(corporateAccountId)
      };
    } catch (error) {
      logger.error('Error fetching corporate analytics:', error);
      throw error;
    }
  }

  /**
   * Get donor journey analysis
   */
  async getDonorJourneyAnalysis(userId) {
    try {
      const donations = await prisma.donation.findMany({
        where: { userId },
        include: {
          project: {
            include: {
              charity: true
            }
          }
        },
        orderBy: { timestamp: 'asc' }
      });

      if (donations.length === 0) {
        return { message: 'No donation history found' };
      }

      const firstDonation = donations[0];
      const latestDonation = donations[donations.length - 1];
      const daysSinceFirst = Math.floor(
        (new Date() - new Date(firstDonation.timestamp)) / (1000 * 60 * 60 * 24)
      );

      return {
        totalDonations: donations.length,
        totalAmount: donations.reduce((sum, d) => sum + d.amount, 0),
        averageDonation: donations.reduce((sum, d) => sum + d.amount, 0) / donations.length,
        firstDonationDate: firstDonation.timestamp,
        latestDonationDate: latestDonation.timestamp,
        daysSinceFirst,
        donationFrequency: donations.length / (daysSinceFirst || 1),
        uniqueCharities: new Set(donations.map(d => d.project.charityId)).size,
        preferredCauses: this._identifyPreferredCauses(donations)
      };
    } catch (error) {
      logger.error('Error analyzing donor journey:', error);
      throw error;
    }
  }

  /**
   * Generate custom report
   */
  async generateCustomReport(filters) {
    try {
      const { startDate, endDate, charityId, corporateAccountId, metric } = filters;

      const where = {
        timestamp: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };

      if (charityId) {
        where.project = { charityId };
      }

      if (corporateAccountId) {
        where.user = { companyId: corporateAccountId };
      }

      const donations = await prisma.donation.findMany({
        where,
        include: {
          user: true,
          project: {
            include: {
              charity: true
            }
          }
        }
      });

      return {
        reportGenerated: new Date(),
        filters,
        summary: {
          totalDonations: donations.length,
          totalAmount: donations.reduce((sum, d) => sum + d.amount, 0),
          uniqueDonors: new Set(donations.map(d => d.userId)).size,
          averageDonation: donations.reduce((sum, d) => sum + d.amount, 0) / donations.length
        },
        data: donations
      };
    } catch (error) {
      logger.error('Error generating custom report:', error);
      throw error;
    }
  }

  // Helper methods
  async _getCohortData(cutoffDate) {
    return await prisma.user.findMany({
      where: {
        role: 'donor',
        createdAt: { gte: cutoffDate }
      },
      include: {
        donations: true
      }
    });
  }

  _calculateRetentionRates(cohorts) {
    const repeatDonors = cohorts.filter(u => u.donations.length > 1).length;
    return {
      overall: (repeatDonors / cohorts.length) * 100,
      repeatDonors: (repeatDonors / cohorts.length) * 100,
      byCohort: {} // Would calculate by month/quarter
    };
  }

  _groupByProject(donations) {
    const grouped = {};
    donations.forEach(d => {
      if (!grouped[d.projectId]) {
        grouped[d.projectId] = {
          projectTitle: d.project.title,
          totalAmount: 0,
          totalUnits: 0,
          count: 0
        };
      }
      grouped[d.projectId].totalAmount += d.amount;
      grouped[d.projectId].totalUnits += d.unitsFunded;
      grouped[d.projectId].count++;
    });
    return Object.values(grouped);
  }

  _getTopCharities(donations) {
    const charityTotals = {};
    donations.forEach(d => {
      const charityName = d.project.charity.name;
      charityTotals[charityName] = (charityTotals[charityName] || 0) + d.amount;
    });
    return Object.entries(charityTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, total]) => ({ name, total }));
  }

  async _getMonthlyTrend(corporateAccountId) {
    // Simplified - would aggregate by month
    return [];
  }

  _identifyPreferredCauses(donations) {
    // Would categorize by cause type
    return [];
  }
}

module.exports = new AnalyticsService();

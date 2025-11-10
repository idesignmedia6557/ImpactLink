const prisma = require('../config/prisma');
const logger = require('./logger');

/**
 * Matching Service for ImpactLink
 * Step 10 - Advanced Features: Corporate Matching Engine
 * Handles corporate donation matching calculations and workflows
 */

class MatchingService {
  /**
   * Create or update matching rule for a corporate account
   */
  async createMatchingRule(corporateAccountId, ruleData) {
    try {
      const { matchRatio, maxPerEmployee, maxPerPeriod, periodType, active = true } = ruleData;

      const rule = await prisma.matchingRule.create({
        data: {
          corporateAccountId,
          matchRatio,
          maxPerEmployee,
          maxPerPeriod,
          periodType,
          active
        }
      });

      logger.info(`Matching rule created for corporate account ${corporateAccountId}`);
      return rule;
    } catch (error) {
      logger.error('Error creating matching rule:', error);
      throw error;
    }
  }

  /**
   * Calculate match amount for a donation
   */
  async calculateMatch(donationId) {
    try {
      const donation = await prisma.donation.findUnique({
        where: { id: donationId },
        include: {
          user: {
            include: {
              company: {
                include: {
                  matchingRules: {
                    where: { active: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!donation || !donation.user.company) {
        return null; // No matching available
      }

      const matchingRule = donation.user.company.matchingRules[0];
      if (!matchingRule) {
        return null;
      }

      // Calculate base match amount
      let matchAmount = donation.amount * matchingRule.matchRatio;

      // Check per-employee limit
      if (matchingRule.maxPerEmployee) {
        const userMatches = await this._getUserPeriodMatches(
          donation.userId,
          matchingRule.periodType
        );
        const totalUserMatches = userMatches.reduce((sum, m) => sum + m.matchedAmount, 0);
        
        if (totalUserMatches + matchAmount > matchingRule.maxPerEmployee) {
          matchAmount = Math.max(0, matchingRule.maxPerEmployee - totalUserMatches);
        }
      }

      // Check per-period limit
      if (matchingRule.maxPerPeriod) {
        const companyMatches = await this._getCompanyPeriodMatches(
          donation.user.companyId,
          matchingRule.periodType
        );
        const totalCompanyMatches = companyMatches.reduce((sum, m) => sum + m.matchedAmount, 0);
        
        if (totalCompanyMatches + matchAmount > matchingRule.maxPerPeriod) {
          matchAmount = Math.max(0, matchingRule.maxPerPeriod - totalCompanyMatches);
        }
      }

      if (matchAmount > 0) {
        // Create match record
        const match = await prisma.match.create({
          data: {
            donationId,
            matchedAmount: matchAmount,
            status: 'pending'
          }
        });

        logger.info(`Match calculated: $${matchAmount} for donation ${donationId}`);
        return match;
      }

      return null;
    } catch (error) {
      logger.error('Error calculating match:', error);
      throw error;
    }
  }

  /**
   * Approve a match
   */
  async approveMatch(matchId, approvedBy) {
    try {
      const match = await prisma.match.update({
        where: { id: matchId },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy
        },
        include: {
          donation: {
            include: {
              project: true,
              user: true
            }
          }
        }
      });

      // Create a matched donation record
      await prisma.donation.create({
        data: {
          userId: match.donation.userId,
          projectId: match.donation.projectId,
          amount: match.matchedAmount,
          unitsFunded: Math.floor(match.matchedAmount / match.donation.project.unitCost),
          paymentId: `match_${match.id}`,
          timestamp: new Date(),
          status: 'completed',
          corporateMatch: true
        }
      });

      logger.info(`Match approved: ${matchId}`);
      return match;
    } catch (error) {
      logger.error('Error approving match:', error);
      throw error;
    }
  }

  /**
   * Get pending matches for a corporate account
   */
  async getPendingMatches(corporateAccountId) {
    try {
      return await prisma.match.findMany({
        where: {
          status: 'pending',
          donation: {
            user: {
              companyId: corporateAccountId
            }
          }
        },
        include: {
          donation: {
            include: {
              user: true,
              project: {
                include: {
                  charity: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      logger.error('Error fetching pending matches:', error);
      throw error;
    }
  }

  /**
   * Get matching statistics for a corporate account
   */
  async getMatchingStats(corporateAccountId, period = 'current') {
    try {
      const dateFilter = this._getPeriodFilter(period);

      const stats = await prisma.match.aggregate({
        where: {
          status: { in: ['approved', 'disbursed'] },
          donation: {
            user: {
              companyId: corporateAccountId
            }
          },
          approvedAt: dateFilter
        },
        _sum: {
          matchedAmount: true
        },
        _count: true
      });

      const employeeParticipation = await prisma.user.count({
        where: {
          companyId: corporateAccountId,
          donations: {
            some: {
              matches: {
                some: {
                  status: { in: ['approved', 'disbursed'] },
                  approvedAt: dateFilter
                }
              }
            }
          }
        }
      });

      return {
        totalMatched: stats._sum.matchedAmount || 0,
        matchCount: stats._count,
        employeeParticipation,
        period
      };
    } catch (error) {
      logger.error('Error fetching matching stats:', error);
      throw error;
    }
  }

  /**
   * Batch approve multiple matches
   */
  async batchApproveMatches(matchIds, approvedBy) {
    try {
      const results = [];
      for (const matchId of matchIds) {
        try {
          const approved = await this.approveMatch(matchId, approvedBy);
          results.push({ matchId, success: true, match: approved });
        } catch (error) {
          results.push({ matchId, success: false, error: error.message });
        }
      }
      return results;
    } catch (error) {
      logger.error('Error batch approving matches:', error);
      throw error;
    }
  }

  async _getUserPeriodMatches(userId, periodType) {
    const dateFilter = this._getPeriodFilter(periodType);
    return await prisma.match.findMany({
      where: {
        donation: { userId },
        status: { in: ['approved', 'disbursed'] },
        approvedAt: dateFilter
      }
    });
  }

  async _getCompanyPeriodMatches(companyId, periodType) {
    const dateFilter = this._getPeriodFilter(periodType);
    return await prisma.match.findMany({
      where: {
        donation: {
          user: { companyId }
        },
        status: { in: ['approved', 'disbursed'] },
        approvedAt: dateFilter
      }
    });
  }

  _getPeriodFilter(periodType) {
    const now = new Date();
    
    if (periodType === 'monthly') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { gte: firstDay };
    } else if (periodType === 'quarterly') {
      const quarter = Math.floor(now.getMonth() / 3);
      const firstDay = new Date(now.getFullYear(), quarter * 3, 1);
      return { gte: firstDay };
    } else if (periodType === 'annual') {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      return { gte: firstDay };
    }
    
    return {};
  }
}

module.exports = new MatchingService();

const prisma = require('../config/prisma');
const logger = require('./logger');

/**
 * Gamification Service for ImpactLink
 * Step 10 - Advanced Features: Gamification
 * Implements leaderboards, achievements, and challenges
 */

class GamificationService {
  /**
   * Get leaderboard data
   * @param {string} type - 'donors', 'companies', or 'charities'
   * @param {string} period - 'monthly', 'quarterly', or 'all-time'
   * @param {number} limit - Number of top entries to return
   */
  async getLeaderboard(type = 'donors', period = 'all-time', limit = 10) {
    try {
      const dateFilter = this._getDateFilter(period);
      
      if (type === 'donors') {
        return await this._getDonorLeaderboard(dateFilter, limit);
      } else if (type === 'companies') {
        return await this._getCompanyLeaderboard(dateFilter, limit);
      } else if (type === 'charities') {
        return await this._getCharityLeaderboard(dateFilter, limit);
      }
      
      throw new Error('Invalid leaderboard type');
    } catch (error) {
      logger.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  async _getDonorLeaderboard(dateFilter, limit) {
    const donors = await prisma.user.findMany({
      where: {
        role: 'donor',
        donations: {
          some: dateFilter
        }
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: { donations: true }
        },
        donations: {
          where: dateFilter,
          select: {
            amount: true
          }
        }
      },
      take: limit
    });

    return donors.map((donor, index) => ({
      rank: index + 1,
      userId: donor.id,
      name: donor.name,
      totalDonations: donor.donations.reduce((sum, d) => sum + d.amount, 0),
      donationCount: donor._count.donations
    })).sort((a, b) => b.totalDonations - a.totalDonations);
  }

  async _getCompanyLeaderboard(dateFilter, limit) {
    const companies = await prisma.corporateAccount.findMany({
      select: {
        id: true,
        companyName: true,
        admins: {
          select: {
            donations: {
              where: dateFilter,
              select: {
                amount: true
              }
            }
          }
        }
      },
      take: limit
    });

    return companies.map((company, index) => {
      const totalDonations = company.admins.reduce((sum, admin) => {
        return sum + admin.donations.reduce((s, d) => s + d.amount, 0);
      }, 0);

      return {
        rank: index + 1,
        companyId: company.id,
        name: company.companyName,
        totalDonations,
        employeeCount: company.admins.length
      };
    }).sort((a, b) => b.totalDonations - a.totalDonations);
  }

  async _getCharityLeaderboard(dateFilter, limit) {
    const charities = await prisma.charity.findMany({
      where: {
        verificationStatus: 'verified',
        projects: {
          some: {
            donations: {
              some: dateFilter
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        projects: {
          select: {
            donations: {
              where: dateFilter,
              select: {
                amount: true
              }
            }
          }
        }
      },
      take: limit
    });

    return charities.map((charity, index) => {
      const totalReceived = charity.projects.reduce((sum, project) => {
        return sum + project.donations.reduce((s, d) => s + d.amount, 0);
      }, 0);

      return {
        rank: index + 1,
        charityId: charity.id,
        name: charity.name,
        totalReceived,
        projectCount: charity.projects.length
      };
    }).sort((a, b) => b.totalReceived - a.totalReceived);
  }

  _getDateFilter(period) {
    const now = new Date();
    
    if (period === 'monthly') {
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { timestamp: { gte: firstDayOfMonth } };
    } else if (period === 'quarterly') {
      const quarter = Math.floor(now.getMonth() / 3);
      const firstDayOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
      return { timestamp: { gte: firstDayOfQuarter } };
    }
    
    return {}; // all-time
  }

  /**
   * Get or create achievement for user
   */
  async checkAndAwardAchievements(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          donations: true,
          badges: true
        }
      });

      if (!user) throw new Error('User not found');

      const achievements = [];

      // Check for various achievements
      const totalDonations = user.donations.reduce((sum, d) => sum + d.amount, 0);
      const donationCount = user.donations.length;

      // First donation
      if (donationCount === 1 && !this._hasBadge(user, 'first_donation')) {
        await this._awardBadge(userId, 'first_donation', 'Welcome Donor');
        achievements.push({ type: 'first_donation', name: 'Welcome Donor' });
      }

      // Impact milestones
      if (totalDonations >= 10 && !this._hasBadge(user, 'impact_10')) {
        await this._awardBadge(userId, 'impact_10', '$10 Impact Hero');
        achievements.push({ type: 'impact_10', name: '$10 Impact Hero' });
      }

      if (totalDonations >= 50 && !this._hasBadge(user, 'impact_50')) {
        await this._awardBadge(userId, 'impact_50', '$50 Change Maker');
        achievements.push({ type: 'impact_50', name: '$50 Change Maker' });
      }

      if (totalDonations >= 100 && !this._hasBadge(user, 'impact_100')) {
        await this._awardBadge(userId, 'impact_100', '$100 Champion');
        achievements.push({ type: 'impact_100', name: '$100 Champion' });
      }

      // Repeat donor
      if (donationCount >= 5 && !this._hasBadge(user, 'repeat_donor')) {
        await this._awardBadge(userId, 'repeat_donor', 'Loyal Supporter');
        achievements.push({ type: 'repeat_donor', name: 'Loyal Supporter' });
      }

      // Monthly donor
      if (this._hasMonthlyDonations(user.donations) && !this._hasBadge(user, 'monthly_donor')) {
        await this._awardBadge(userId, 'monthly_donor', 'Monthly Champion');
        achievements.push({ type: 'monthly_donor', name: 'Monthly Champion' });
      }

      return achievements;
    } catch (error) {
      logger.error('Error checking achievements:', error);
      throw error;
    }
  }

  _hasBadge(user, badgeType) {
    return user.badges.some(b => b.badgeType === badgeType);
  }

  async _awardBadge(userId, badgeType, description) {
    await prisma.badge.create({
      data: {
        userId,
        badgeType,
        description,
        awardedAt: new Date()
      }
    });
    logger.info(`Badge awarded: ${badgeType} to user ${userId}`);
  }

  _hasMonthlyDonations(donations) {
    if (donations.length < 3) return false;
    
    const sortedDonations = donations.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    let consecutiveMonths = 1;
    for (let i = 1; i < sortedDonations.length; i++) {
      const prevMonth = new Date(sortedDonations[i-1].timestamp).getMonth();
      const currMonth = new Date(sortedDonations[i].timestamp).getMonth();
      
      if (currMonth === prevMonth + 1 || (prevMonth === 11 && currMonth === 0)) {
        consecutiveMonths++;
        if (consecutiveMonths >= 3) return true;
      } else {
        consecutiveMonths = 1;
      }
    }
    
    return false;
  }

  /**
   * Get active challenges
   */
  async getActiveChallenges() {
    try {
      // This would typically come from a challenges table
      // For now, return static monthly challenges
      const now = new Date();
      const monthName = now.toLocaleString('default', { month: 'long' });
      
      return [
        {
          id: `monthly_${now.getFullYear()}_${now.getMonth()}`,
          title: `${monthName} Impact Challenge`,
          description: 'Donate to 3 different projects this month',
          type: 'monthly',
          target: 3,
          reward: 'Exclusive Challenge Winner Badge',
          startDate: new Date(now.getFullYear(), now.getMonth(), 1),
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        },
        {
          id: `quarterly_${now.getFullYear()}_Q${Math.floor(now.getMonth() / 3) + 1}`,
          title: 'Quarterly Super Supporter',
          description: 'Reach $100 in total donations this quarter',
          type: 'quarterly',
          target: 100,
          reward: 'Super Supporter Badge + Feature in Newsletter',
          startDate: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1),
          endDate: new Date(now.getFullYear(), (Math.floor(now.getMonth() / 3) + 1) * 3, 0)
        }
      ];
    } catch (error) {
      logger.error('Error fetching challenges:', error);
      throw error;
    }
  }

  /**
   * Check user progress on active challenges
   */
  async getUserChallengeProgress(userId) {
    try {
      const challenges = await this.getActiveChallenges();
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          donations: {
            include: {
              project: true
            }
          }
        }
      });

      return challenges.map(challenge => {
        let progress = 0;
        
        if (challenge.type === 'monthly') {
          const uniqueProjects = new Set(
            user.donations
              .filter(d => new Date(d.timestamp) >= challenge.startDate && 
                          new Date(d.timestamp) <= challenge.endDate)
              .map(d => d.projectId)
          );
          progress = uniqueProjects.size;
        } else if (challenge.type === 'quarterly') {
          progress = user.donations
            .filter(d => new Date(d.timestamp) >= challenge.startDate && 
                        new Date(d.timestamp) <= challenge.endDate)
            .reduce((sum, d) => sum + d.amount, 0);
        }

        return {
          ...challenge,
          progress,
          completed: progress >= challenge.target,
          percentage: Math.min(100, (progress / challenge.target) * 100)
        };
      });
    } catch (error) {
      logger.error('Error fetching user challenge progress:', error);
      throw error;
    }
  }
}

module.exports = new GamificationService();

// DonorDashboard.js - Dashboard for donor users

import React, { useState, useEffect } from 'react';
import { useDonation } from '../context/DonationContext';
import { getCurrentUser } from '../services/auth';
import './DonorDashboard.css';

const DonorDashboard = () => {
  const { 
    donationHistory, 
    loadDonationHistory, 
    getTotalDonated, 
    getDonationCount 
  } = useDonation();
  
  const [user, setUser] = useState(null);
  const [savedCharities, setSavedCharities] = useState([]);
  const [recurringDonations, setRecurringDonations] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    // Load all dashboard data
    const loadData = async () => {
      try {
        await loadDonationHistory();
        await loadSavedCharities();
        await loadRecurringDonations();
        await loadBadges();
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadSavedCharities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/saved-charities', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSavedCharities(data);
      }
    } catch (error) {
      console.error('Failed to load saved charities:', error);
    }
  };

  const loadRecurringDonations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/donations/recurring', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRecurringDonations(data);
      }
    } catch (error) {
      console.error('Failed to load recurring donations:', error);
    }
  };

  const loadBadges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/badges', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBadges(data);
      }
    } catch (error) {
      console.error('Failed to load badges:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="donor-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Welcome back, {user?.name}!</h1>
        <p className="subtitle">Your impact at a glance</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon donations">💰</div>
          <div className="stat-content">
            <h3>Total Donated</h3>
            <p className="stat-value">${getTotalDonated().toFixed(2)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon count">📊</div>
          <div className="stat-content">
            <h3>Donations Made</h3>
            <p className="stat-value">{getDonationCount()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon charities">❤️</div>
          <div className="stat-content">
            <h3>Saved Charities</h3>
            <p className="stat-value">{savedCharities.length}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon badges">🏆</div>
          <div className="stat-content">
            <h3>Badges Earned</h3>
            <p className="stat-value">{badges.length}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Recent Donations */}
        <section className="dashboard-section">
          <h2>Recent Donations</h2>
          {donationHistory.length > 0 ? (
            <div className="donations-list">
              {donationHistory.slice(0, 5).map((donation) => (
                <div key={donation.id} className="donation-item">
                  <div className="donation-info">
                    <h4>{donation.charity?.name || 'Unknown Charity'}</h4>
                    <p className="donation-project">
                      {donation.project?.name || 'General Donation'}
                    </p>
                    <span className="donation-date">
                      {new Date(donation.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="donation-amount">
                    ${donation.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No donations yet. Start making an impact!</p>
          )}
        </section>

        {/* Recurring Donations */}
        <section className="dashboard-section">
          <h2>Recurring Donations</h2>
          {recurringDonations.length > 0 ? (
            <div className="recurring-list">
              {recurringDonations.map((recurring) => (
                <div key={recurring.id} className="recurring-item">
                  <div className="recurring-info">
                    <h4>{recurring.charity?.name}</h4>
                    <p className="recurring-frequency">{recurring.frequency}</p>
                  </div>
                  <div className="recurring-amount">
                    ${recurring.amount.toFixed(2)}
                  </div>
                  <div className="recurring-status">
                    <span className={`status-badge ${recurring.status.toLowerCase()}`}>
                      {recurring.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No recurring donations set up.</p>
          )}
        </section>

        {/* Saved Charities */}
        <section className="dashboard-section">
          <h2>Saved Charities</h2>
          {savedCharities.length > 0 ? (
            <div className="charities-grid">
              {savedCharities.map((charity) => (
                <div key={charity.id} className="charity-card">
                  <img 
                    src={charity.logoUrl || '/placeholder-charity.png'} 
                    alt={charity.name}
                    className="charity-logo"
                  />
                  <h4>{charity.name}</h4>
                  <p className="charity-category">{charity.category}</p>
                  <button className="btn-primary">Donate Now</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No saved charities yet.</p>
          )}
        </section>

        {/* Badges */}
        {badges.length > 0 && (
          <section className="dashboard-section">
            <h2>Your Badges</h2>
            <div className="badges-grid">
              {badges.map((badge) => (
                <div key={badge.id} className="badge-item">
                  <div className="badge-icon">{badge.icon}</div>
                  <h4>{badge.name}</h4>
                  <p>{badge.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default DonorDashboard;

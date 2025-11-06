import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './UserDashboard.css';
import { getUserDonations, getUserImpact } from '../services/api';

interface Donation {
  id: string;
  // TODO: Replace mock fetchDonations with real API call:
// Example: const fetchDonations = async () => {
//   try {
//     setLoading(true);
//     const userEmail = 'user@example.com'; // Get from auth context
//     const data = await getUserImpact(userEmail);
//     setDonations(data.donations || []);
//   } catch (error) {
//     console.error('Error fetching donations:', error);
//   } finally {
//     setLoading(false);
//   }
// };
  charityName: string;
  amount: number;
  date: string;
  frequency: 'one-time' | 'monthly';
  status: 'completed' | 'pending';
}

interface ImpactStat {
  title: string;
  value: string;
  icon: string;
}

const UserDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'impact'>('overview');

  useEffect(() => {
    // Check for donation success message
    if (searchParams.get('donation') === 'success') {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }

    // Fetch user donations - placeholder
    const fetchDonations = async () => {
      setLoading(true);
      // Simulating API call
      setTimeout(() => {
        setDonations([
          {
            id: '1',
            charityName: 'Global Education Fund',
            amount: 100,
            date: '2024-10-15',
            frequency: 'one-time',
            status: 'completed'
          },
          {
            id: '2',
            charityName: 'Clean Water Initiative',
            amount: 50,
            date: '2024-10-01',
            frequency: 'monthly',
            status: 'completed'
          },
          {
            id: '3',
            charityName: 'Healthcare for All',
            amount: 75,
            date: '2024-09-20',
            frequency: 'one-time',
            status: 'completed'
          }
        ]);
        setLoading(false);
      }, 500);
    };

    fetchDonations();
  }, [searchParams]);

  const getTotalDonated = () => {
    return donations.reduce((total, donation) => total + donation.amount, 0);
  };

  const getMonthlyCommitment = () => {
    return donations
      .filter((d) => d.frequency === 'monthly')
      .reduce((total, donation) => total + donation.amount, 0);
  };

  const impactStats: ImpactStat[] = [
    { title: 'Total Donated', value: `$${getTotalDonated()}`, icon: '💵' },
    { title: 'Charities Supported', value: '3', icon: '🏛️' },
    { title: 'Monthly Commitment', value: `$${getMonthlyCommitment()}`, icon: '📅' },
    { title: 'Impact Score', value: '95', icon: '🎯' }
  ];

  return (
    <div className="dashboard-container">
      {showSuccessMessage && (
        <div className="success-banner">
          ✅ Thank you! Your donation was processed successfully.
        </div>
      )}

      <header className="dashboard-header">
        <h1>My Dashboard</h1>
        <Link to="/donate" className="btn btn-primary">
          Make Another Donation
        </Link>
      </header>

      <div className="dashboard-tabs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
        >
          Donation History
        </button>
        <button
          onClick={() => setActiveTab('impact')}
          className={`tab-btn ${activeTab === 'impact' ? 'active' : ''}`}
        >
          My Impact
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <>
            <section className="stats-section">
              <div className="stats-grid">
                {impactStats.map((stat, index) => (
                  <div key={index} className="stat-card">
                    <span className="stat-icon">{stat.icon}</span>
                    <h3>{stat.value}</h3>
                    <p>{stat.title}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="recent-donations">
              <h2>Recent Donations</h2>
              {loading ? (
                <p>Loading...</p>
              ) : donations.length > 0 ? (
                <div className="donations-list">
                  {donations.slice(0, 3).map((donation) => (
                    <div key={donation.id} className="donation-item">
                      <div className="donation-info">
                        <h3>{donation.charityName}</h3>
                        <p className="donation-date">{donation.date}</p>
                      </div>
                      <div className="donation-details">
                        <span className="amount">${donation.amount}</span>
                        <span className="frequency">
                          {donation.frequency === 'monthly' ? '🔁 Monthly' : 'One-time'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-donations">
                  <p>No donations yet. Start making a difference today!</p>
                  <Link to="/donate" className="btn btn-secondary">
                    Make Your First Donation
                  </Link>
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'history' && (
          <section className="history-section">
            <h2>Donation History</h2>
            {loading ? (
              <p>Loading...</p>
            ) : donations.length > 0 ? (
              <div className="history-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Charity</th>
                      <th>Amount</th>
                      <th>Frequency</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map((donation) => (
                      <tr key={donation.id}>
                        <td>{donation.date}</td>
                        <td>{donation.charityName}</td>
                        <td>${donation.amount}</td>
                        <td>
                          {donation.frequency === 'monthly' ? 'Monthly' : 'One-time'}
                        </td>
                        <td>
                          <span className={`status-badge ${donation.status}`}>
                            {donation.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No donation history available.</p>
            )}
          </section>
        )}

        {activeTab === 'impact' && (
          <section className="impact-section">
            <h2>Your Impact</h2>
            <div className="impact-metrics">
              <div className="impact-card">
                <h3>🎓 Education Impact</h3>
                <p>Your donations have provided school supplies for <strong>15 children</strong></p>
              </div>
              <div className="impact-card">
                <h3>💧 Water Access</h3>
                <p>Helped provide clean water to <strong>3 families</strong> for a year</p>
              </div>
              <div className="impact-card">
                <h3>🏥 Healthcare Support</h3>
                <p>Contributed to healthcare services for <strong>20 people</strong></p>
              </div>
            </div>
            <div className="impact-timeline">
              <h3>Impact Timeline</h3>
              <p>Track how your contributions have made a difference over time</p>
              <div className="timeline-placeholder">
                <p>📈 Impact tracking visualization coming soon</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;

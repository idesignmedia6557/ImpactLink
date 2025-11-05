import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './CharityProfile.css';

interface CharityData {
  id: string;
  name: string;
  category: string;
  description: string;
  longDescription: string;
  imageUrl: string;
  rating: number;
  impactScore: number;
  location: string;
  website: string;
  established: string;
  totalDonations: string;
  activeDonors: number;
  programs: string[];
  recentImpact: {
    title: string;
    description: string;
    date: string;
  }[];
}

const CharityProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [charity, setCharity] = useState<CharityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder - will be replaced with API call
    const fetchCharity = async () => {
      setLoading(true);
      // Simulating API call
      setTimeout(() => {
        setCharity({
          id: id || '1',
          name: 'Global Education Fund',
          category: 'Education',
          description: 'Providing quality education to underprivileged children worldwide',
          longDescription:
            'Global Education Fund is dedicated to breaking the cycle of poverty through education. We provide schools, teachers, and learning materials to communities in need across 45 countries.',
          imageUrl: '/placeholder-charity.jpg',
          rating: 4.8,
          impactScore: 95,
          location: 'International',
          website: 'https://example.org',
          established: '2010',
          totalDonations: '$5.2M',
          activeDonors: 12500,
          programs: [
            'School Infrastructure',
            'Teacher Training',
            'Learning Materials',
            'Scholarship Programs'
          ],
          recentImpact: [
            {
              title: 'New School Opening in Kenya',
              description: 'Opened a new school serving 500 students',
              date: '2024-10-15'
            },
            {
              title: 'Teacher Training Program',
              description: 'Trained 100 teachers in modern teaching methods',
              date: '2024-09-20'
            }
          ]
        });
        setLoading(false);
      }, 500);
    };

    fetchCharity();
  }, [id]);

  if (loading) {
    return <div className="loading">Loading charity profile...</div>;
  }

  if (!charity) {
    return <div className="error">Charity not found</div>;
  }

  return (
    <div className="charity-profile-container">
      <div className="profile-header">
        <img src={charity.imageUrl} alt={charity.name} className="charity-image" />
        <div className="header-info">
          <h1>{charity.name}</h1>
          <span className="category-badge">{charity.category}</span>
          <p className="description">{charity.description}</p>
          <div className="stats">
            <div className="stat">
              <span className="stat-value">⭐ {charity.rating}</span>
              <span className="stat-label">Rating</span>
            </div>
            <div className="stat">
              <span className="stat-value">{charity.impactScore}%</span>
              <span className="stat-label">Impact Score</span>
            </div>
            <div className="stat">
              <span className="stat-value">{charity.activeDonors.toLocaleString()}</span>
              <span className="stat-label">Active Donors</span>
            </div>
          </div>
          <Link to={`/donate?charity=${charity.id}`} className="btn btn-donate">
            Donate Now
          </Link>
        </div>
      </div>

      <div className="profile-content">
        <section className="about-section">
          <h2>About</h2>
          <p>{charity.longDescription}</p>
          <div className="charity-details">
            <div className="detail">
              <strong>Location:</strong> {charity.location}
            </div>
            <div className="detail">
              <strong>Established:</strong> {charity.established}
            </div>
            <div className="detail">
              <strong>Website:</strong>{' '}
              <a href={charity.website} target="_blank" rel="noopener noreferrer">
                {charity.website}
              </a>
            </div>
            <div className="detail">
              <strong>Total Donations:</strong> {charity.totalDonations}
            </div>
          </div>
        </section>

        <section className="programs-section">
          <h2>Programs</h2>
          <div className="programs-grid">
            {charity.programs.map((program, index) => (
              <div key={index} className="program-card">
                <h3>{program}</h3>
              </div>
            ))}
          </div>
        </section>

        <section className="impact-section">
          <h2>Recent Impact</h2>
          <div className="impact-timeline">
            {charity.recentImpact.map((impact, index) => (
              <div key={index} className="impact-item">
                <div className="impact-date">{impact.date}</div>
                <div className="impact-content">
                  <h3>{impact.title}</h3>
                  <p>{impact.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CharityProfile;

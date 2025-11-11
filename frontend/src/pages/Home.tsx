import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home-container">
      <header className="hero-section">
        <h1>Welcome to ImpactLink</h1>
        <p className="tagline">
          Connecting donors with verified charities for transparent, impactful giving
        </p>
        <div className="cta-buttons">
          <Link to="/discover" className="btn btn-primary">
            Discover Charities
          </Link>
          <Link to="/donate" className="btn btn-secondary">
            Start Donating
          </Link>
        </div>
      </header>

      <section className="features">
        <h2>Why Choose ImpactLink?</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>🔍 Verified Charities</h3>
            <p>All charities are thoroughly vetted and verified</p>
          </div>
          <div className="feature-card">
            <h3>💳 Secure Donations</h3>
            <p>Safe and secure payment processing</p>
          </div>
          <div className="feature-card">
            <h3>📊 Transparent Impact</h3>
            <p>Track your donations and see real impact</p>
          </div>
          <div className="feature-card">
            <h3>🌍 Global Reach</h3>
            <p>Support causes worldwide</p>
          </div>
        </div>
      </section>

      <section className="stats">
        <h2>Our Impact</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>1,000+</h3>
            <p>Verified Charities</p>
          </div>
          <div className="stat-card">
            <h3>$10M+</h3>
            <p>Donations Processed</p>
          </div>
          <div className="stat-card">
            <h3>50K+</h3>
            <p>Active Donors</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to Make a Difference?</h2>
        <p>Join thousands of donors creating positive change</p>
        <Link to="/discover" className="btn btn-primary">
          Get Started
        </Link>
      </section>
    </div>
  );
};

export default Home;
// Fixed: Ensure proper module resolution for Home component

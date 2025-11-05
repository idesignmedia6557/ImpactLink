import React from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">Connect Donors with Verified Charities</h1>
        <p className="hero-subtitle">
          Make a real difference. Support transparent, impactful projects and track your contribution every step of the way.
        </p>
        <div className="hero-buttons">
          <Link to="/discover" className="btn btn-primary">
            Discover Projects
          </Link>
          <Link to="/donate" className="btn btn-secondary">
            Donate Now
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;

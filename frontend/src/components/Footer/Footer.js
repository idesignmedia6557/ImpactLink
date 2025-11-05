import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>ImpactLink</h3>
          <p>
            Connecting donors with verified charities for transparent, impactful giving.
          </p>
          <div className="social-links">
            <a href="#" aria-label="Facebook">f</a>
            <a href="#" aria-label="Twitter">t</a>
            <a href="#" aria-label="LinkedIn">in</a>
            <a href="#" aria-label="Instagram">ig</a>
          </div>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/discover">Discover</Link>
            </li>
            <li>
              <Link to="/donate">Donate</Link>
            </li>
            <li>
              <Link to="/user/dashboard">Dashboard</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>About</h4>
          <ul>
            <li>
              <Link to="/about">About Us</Link>
            </li>
            <li>
              <Link to="/how-it-works">How It Works</Link>
            </li>
            <li>
              <Link to="/charities">Our Charities</Link>
            </li>
            <li>
              <Link to="/impact">Impact Stories</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Support</h4>
          <ul>
            <li>
              <Link to="/faq">FAQ</Link>
            </li>
            <li>
              <Link to="/contact">Contact Us</Link>
            </li>
            <li>
              <Link to="/privacy">Privacy Policy</Link>
            </li>
            <li>
              <Link to="/terms">Terms of Service</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} ImpactLink. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;

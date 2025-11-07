import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './NavBar.css';

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  // TODO: Get user from AuthContext
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isLoggedIn = !!user;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const renderUserLinks = () => {
    if (!isLoggedIn) {
      return (
        <>
          <Link to="/login" className="nav-link">
            Login
          </Link>
          <Link to="/signup" className="nav-btn">
            Sign Up
          </Link>
        </>
      );
    }

    // Role-based navigation links
    switch (user.userType) {
      case 'DONOR':
        return (
          <>
            <Link to="/donor-dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link to="/saved-charities" className="nav-link">
              Saved Charities
            </Link>
            <Link to="/donation-history" className="nav-link">
              Donations
            </Link>
            <button onClick={handleLogout} className="nav-link logout-btn">
              Logout
            </button>
          </>
        );

      case 'CHARITY':
        return (
          <>
            <Link to="/charity-dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link to="/my-projects" className="nav-link">
              My Projects
            </Link>
            <Link to="/campaigns" className="nav-link">
              Campaigns
            </Link>
            <Link to="/reports" className="nav-link">
              Reports
            </Link>
            <button onClick={handleLogout} className="nav-link logout-btn">
              Logout
            </button>
          </>
        );

      case 'CORPORATE':
        return (
          <>
            <Link to="/corporate-dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link to="/partnerships" className="nav-link">
              Partnerships
            </Link>
            <Link to="/impact-reports" className="nav-link">
              Impact Reports
            </Link>
            <button onClick={handleLogout} className="nav-link logout-btn">
              Logout
            </button>
          </>
        );

      case 'ADMIN':
        return (
          <>
            <Link to="/admin-console" className="nav-link">
              Admin Console
            </Link>
            <Link to="/verify-charities" className="nav-link">
              Verify Charities
            </Link>
            <Link to="/analytics" className="nav-link">
              Analytics
            </Link>
            <button onClick={handleLogout} className="nav-link logout-btn">
              Logout
            </button>
          </>
        );

      default:
        return (
          <button onClick={handleLogout} className="nav-link logout-btn">
            Logout
          </button>
        );
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <svg className="logo-icon" width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="14" fill="#3b82f6" />
            <path d="M16 8 L16 24 M10 14 L16 8 L22 14" stroke="white" strokeWidth="2" fill="none" />
          </svg>
          <span className="logo-text">ImpactLink</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="nav-links-desktop">
          <Link to="/" className="nav-link">
            Browse Projects
          </Link>
          <Link to="/charities" className="nav-link">
            Charities
          </Link>
          <Link to="/about" className="nav-link">
            About
          </Link>
          <Link to="/how-it-works" className="nav-link">
            How It Works
          </Link>
        </div>

        {/* User Actions */}
        <div className="nav-actions">
          {renderUserLinks()}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="mobile-menu">
          <Link to="/" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
            Browse Projects
          </Link>
          <Link to="/charities" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
            Charities
          </Link>
          <Link to="/about" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
            About
          </Link>
          <Link to="/how-it-works" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
            How It Works
          </Link>
          <div className="mobile-divider"></div>
          <div className="mobile-user-actions">
            {renderUserLinks()}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;

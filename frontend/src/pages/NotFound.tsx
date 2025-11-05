import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound: React.FC = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1 className="error-code">404</h1>
        <h2>Page Not Found</h2>
        <p className="error-message">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary">
            Go Home
          </Link>
          <Link to="/discover" className="btn btn-secondary">
            Discover Charities
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

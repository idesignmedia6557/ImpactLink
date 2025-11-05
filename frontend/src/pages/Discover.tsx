import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Discover.css';

interface Charity {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  rating: number;
  impactScore: number;
}

const Discover: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  // Placeholder charity data - will be replaced with API calls
  const charities: Charity[] = [
    {
      id: '1',
      name: 'Global Education Fund',
      category: 'Education',
      description: 'Providing quality education to underprivileged children worldwide',
      imageUrl: '/placeholder-charity.jpg',
      rating: 4.8,
      impactScore: 95
    },
    // More charities will be loaded from API
  ];

  const categories = [
    'All',
    'Education',
    'Healthcare',
    'Environment',
    'Poverty Relief',
    'Animal Welfare',
    'Human Rights'
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category.toLowerCase());
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  return (
    <div className="discover-container">
      <header className="discover-header">
        <h1>Discover Charities</h1>
        <p>Find verified charities making real impact</p>
      </header>

      <div className="search-filter-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search charities..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        <div className="filter-section">
          <div className="category-filters">
            <h3>Categories</h3>
            <div className="category-buttons">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`category-btn ${
                    selectedCategory === category.toLowerCase() ? 'active' : ''
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="sort-section">
            <label htmlFor="sort">Sort by:</label>
            <select id="sort" value={sortBy} onChange={handleSortChange}>
              <option value="rating">Rating</option>
              <option value="impact">Impact Score</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      </div>

      <div className="charities-grid">
        {charities.length > 0 ? (
          charities.map((charity) => (
            <div key={charity.id} className="charity-card">
              <img src={charity.imageUrl} alt={charity.name} />
              <div className="charity-info">
                <h3>{charity.name}</h3>
                <span className="category-badge">{charity.category}</span>
                <p>{charity.description}</p>
                <div className="charity-stats">
                  <span>⭐ {charity.rating}/5</span>
                  <span>📈 Impact: {charity.impactScore}%</span>
                </div>
                <Link to={`/charity/${charity.id}`} className="btn btn-view">
                  View Profile
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>No charities found. Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;

# Pages API Integration Guide

## Overview
This document provides comprehensive step-by-step instructions for integrating the ImpactLink API service into the Discover, Donate, and Charity Profile pages.

## Prerequisites
✅ AuthContext and Login component (Completed in Step 2)
✅ API service (src/services/api.js) with all endpoints
✅ UserDashboard integrated with real API calls (Completed in Step 3)

---

## STEP 1: Discover Page Integration

### File: `frontend/src/pages/Discover.tsx`

### Current State
- Uses static mock data for charities
- No API integration
- Placeholder charity array

### Integration Steps

#### 1.1 Add Required Imports
```typescript
import { useAuth } from '../context/AuthContext';
import { getCharities } from '../services/api';
import { useEffect } from 'react';
```

#### 1.2 Update Component State
Add state for loading, error, and API data:

```typescript
const [charities, setCharities] = useState<Charity[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const { user } = useAuth();
```

#### 1.3 Add useEffect for Data Fetching
```typescript
useEffect(() => {
  const fetchCharities = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getCharities();
      
      if (response.success && response.charities) {
        setCharities(response.charities);
      } else {
        setCharities([]);
      }
    } catch (err) {
      console.error('Error fetching charities:', err);
      setError('Failed to load charities. Please try again later.');
      setCharities([]);
    } finally {
      setLoading(false);
    }
  };

  fetchCharities();
}, []);
```

#### 1.4 Update JSX for Loading/Error States
Replace the charities grid section with:

```typescript
<div className=\"charities-grid\">
  {loading ? (
    <div className=\"loading-state\">
      <p>Loading charities...</p>
    </div>
  ) : error ? (
    <div className=\"error-state\">
      <p>{error}</p>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  ) : charities.length > 0 ? (
    charities
      .filter(charity => 
        selectedCategory === 'all' || charity.category.toLowerCase() === selectedCategory
      )
      .filter(charity =>
        charity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        charity.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map((charity) => (
        <div key={charity.id} className=\"charity-card\">
          {/* Existing charity card content */}
        </div>
      ))
  ) : (
    <div className=\"no-results\">
      <p>No charities found. Try adjusting your filters.</p>
    </div>
  )}
</div>
```

---

## STEP 2: Donate Page Integration

### File: `frontend/src/pages/Donate.tsx`

### Current State
- Static donation form
- No authentication check
- No API integration for creating donations

### Integration Steps

#### 2.1 Add Required Imports
```typescript
import { useAuth } from '../context/AuthContext';
import { createDonation } from '../services/api';
import { useNavigate } from 'react-router-dom';
```

#### 2.2 Add Component State
```typescript
const { user, isAuthenticated } = useAuth();
const navigate = useNavigate();
const [donationAmount, setDonationAmount] = useState('');
const [charityId, setCharityId] = useState('');
const [message, setMessage] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
```

#### 2.3 Add Authentication Check
```typescript
useEffect(() => {
  if (!isAuthenticated) {
    navigate('/login', { state: { from: '/donate' } });
  }
}, [isAuthenticated, navigate]);
```

#### 2.4 Create Donation Submission Handler
```typescript
const handleDonationSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!user || !user.email) {
    setError('Please log in to make a donation');
    return;
  }

  try {
    setLoading(true);
    setError('');

    const donationData = {
      amount: parseFloat(donationAmount),
      campaignId: charityId,
      donorEmail: user.email,
      donorName: user.name,
      message: message,
      currency: 'USD'
    };

    const response = await createDonation(donationData);

    if (response.success) {
      // Redirect to payment or success page
      navigate(`/payment/${response.donation._id}`);
    } else {
      setError('Failed to create donation. Please try again.');
    }
  } catch (err) {
    console.error('Donation error:', err);
    setError('An error occurred. Please try again later.');
  } finally {
    setLoading(false);
  }
};
```

#### 2.5 Update Form JSX
```typescript
<form onSubmit={handleDonationSubmit}>
  <input 
    type=\"number\" 
    value={donationAmount}
    onChange={(e) => setDonationAmount(e.target.value)}
    placeholder=\"Enter amount\"
    required
    disabled={loading}
  />
  {error && <div className=\"error-message\">{error}</div>}
  <button type=\"submit\" disabled={loading}>
    {loading ? 'Processing...' : 'Donate Now'}
  </button>
</form>
```

---

## STEP 3: Charity Profile Page Integration

### File: `frontend/src/pages/CharityProfile.tsx`

### Current State
- Uses mock charity data
- No real donation history
- Static impact metrics

### Integration Steps

#### 3.1 Add Required Imports
```typescript
import { useAuth } from '../context/AuthContext';
import { getCharityById, getCharityDonations } from '../services/api';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
```

#### 3.2 Add Component State
```typescript
const { id } = useParams<{ id: string }>();
const { user } = useAuth();
const [charity, setCharity] = useState<any>(null);
const [donations, setDonations] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
```

#### 3.3 Add Data Fetching Logic
```typescript
useEffect(() => {
  const fetchCharityData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError('');

      // Fetch charity details and donations in parallel
      const [charityResponse, donationsResponse] = await Promise.all([
        getCharityById(id),
        getCharityDonations(id)
      ]);

      if (charityResponse.success && charityResponse.charity) {
        setCharity(charityResponse.charity);
      } else {
        setError('Charity not found');
      }

      if (donationsResponse.success && donationsResponse.donations) {
        setDonations(donationsResponse.donations);
      }
    } catch (err) {
      console.error('Error fetching charity data:', err);
      setError('Failed to load charity information');
    } finally {
      setLoading(false);
    }
  };

  fetchCharityData();
}, [id]);
```

#### 3.4 Calculate Impact Metrics
```typescript
const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);
const donorCount = new Set(donations.map(d => d.donorEmail)).size;
const recentDonations = donations
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  .slice(0, 5);
```

#### 3.5 Update JSX with Loading States
```typescript
if (loading) {
  return <div className=\"loading\">Loading charity profile...</div>;
}

if (error) {
  return (
    <div className=\"error\">
      <p>{error}</p>
      <Link to=\"/discover\">Back to Discover</Link>
    </div>
  );
}

if (!charity) {
  return <div className=\"not-found\">Charity not found</div>;
}

return (
  <div className=\"charity-profile\">
    <h1>{charity.name}</h1>
    <div className=\"impact-stats\">
      <div className=\"stat\">
        <h3>${totalDonated.toFixed(2)}</h3>
        <p>Total Raised</p>
      </div>
      <div className=\"stat\">
        <h3>{donorCount}</h3>
        <p>Donors</p>
      </div>
    </div>
    {/* Rest of profile content */}
  </div>
);
```

---

## Testing Checklist

### Discover Page
- [ ] Page loads without errors
- [ ] Loading state displays while fetching data
- [ ] Charities display when API returns data
- [ ] Empty state shows when no charities available
- [ ] Error handling works when API fails
- [ ] Search and filter functionality works with API data

### Donate Page
- [ ] Redirects to login if user not authenticated
- [ ] Form fields capture user input correctly
- [ ] Donation submission calls createDonation API
- [ ] Loading state shows during submission
- [ ] Error messages display properly
- [ ] Success redirects to payment/confirmation page

### Charity Profile Page
- [ ] Charity data loads from API using URL parameter
- [ ] Donation history displays correctly
- [ ] Impact metrics calculate properly from real data
- [ ] Loading and error states work correctly
- [ ] Page handles missing/invalid charity IDs gracefully

---

## Environment Configuration

### Update `.env` file
Ensure your frontend `.env` file has the correct API URL:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

For production deployment:
```env
REACT_APP_API_URL=https://ucikoevents.co.za/api
```

---

## API Endpoint Reference

### From `src/services/api.js`:

| Function | Endpoint | Parameters | Usage |
|----------|----------|------------|-------|
| `getCharities()` | GET /charities | - | Fetch all charities |
| `getCharityById(id)` | GET /charities/:id | charityId | Get single charity |
| `getCharityDonations(id)` | GET /donations?campaignId= | charityId | Get charity's donations |
| `createDonation(data)` | POST /donations | donationData | Create new donation |

---

## Next Steps

After completing these integrations:

1. **Test each page individually** with backend running
2. **Verify authentication flow** across all pages
3. **Check error handling** for network failures
4. **Test edge cases** (empty data, invalid IDs, etc.)
5. **Proceed to Step 5**: End-to-end testing

---

## Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Discover Page | ⏳ Pending | Needs API integration |
| Donate Page | ⏳ Pending | Needs API integration |
| Charity Profile | ⏳ Pending | Needs API integration |
| API Service | ✅ Complete | All endpoints ready |
| AuthContext | ✅ Complete | User auth system working |
| UserDashboard | ✅ Complete | API integration done |

---

## Completion Criteria

All three pages will be considered complete when:
- ✅ All API calls successfully fetch/send data
- ✅ Loading states display correctly
- ✅ Error handling works for all failure scenarios
- ✅ Authentication checks prevent unauthorized access
- ✅ User data from AuthContext is properly used
- ✅ UI updates reflect real-time API data

---

**Document Created**: Step 4 of 5-step implementation plan
**Next Step**: End-to-end testing with backend server running

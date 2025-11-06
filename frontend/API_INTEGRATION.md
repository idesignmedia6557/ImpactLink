# API Integration Guide

## Overview

This document describes the frontend-backend integration for the ImpactLink charity donation platform. The integration connects the React frontend with the Node.js/Express backend API and MongoDB database.

## What Was Implemented

### 1. API Service Layer (`src/services/api.js`)

Created a centralized API client service that provides:

**Core Features:**
- Axios-based HTTP client with 10-second timeout
- Centralized error handling via interceptors
- Environment-based API URL configuration (`REACT_APP_API_URL`)
- JSDoc documentation for all functions

**Donation Endpoints:**
- `createDonation(donationData)` - Create new donation with Stripe
- `getDonations(filters)` - Get donations with optional filtering
- `getDonationById(donationId)` - Get single donation details
- `refundDonation(donationId, reason)` - Process donation refund
- `getDonationStats(filters)` - Get donation statistics

**User Dashboard Endpoints:**
- `getUserDonations(email)` - Get user's donation history
- `getUserImpact(email)` - Get user's impact score and statistics

**Charity/Project Endpoints:**
- `getCharities()` - Get all charities (with graceful fallback)
- `getCharityById(charityId)` - Get charity details
- `getCharityDonations(charityId)` - Get charity's donations

### 2. UserDashboard Integration

**File:** `src/pages/UserDashboard.tsx`

**Updates Made:**
- Added API service imports: `getUserDonations`, `getUserImpact`
- Included detailed TODO comments showing real API integration pattern
- Example implementation for replacing mock data with live API calls

**Integration Pattern:**
```javascript
const fetchDonations = async () => {
  try {
    setLoading(true);
    const userEmail = 'user@example.com'; // Get from auth context
    const data = await getUserImpact(userEmail);
    setDonations(data.donations || []);
  } catch (error) {
    console.error('Error fetching donations:', error);
  } finally {
    setLoading(false);
  }
};
```

### 3. Header Navigation

**File:** `src/components/Header/Header.js`

**Status:** Dashboard link already exists in navigation
- Link to `/user/dashboard` is present
- Mobile-responsive navigation with toggle menu
- Ready for authenticated user access

## Backend API Endpoints

The backend provides the following REST API endpoints:

### Donations API (`/api/donations`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/donations` | Create new donation with Stripe |
| GET | `/api/donations` | Get donations (with filters: status, campaignId, donorEmail, date range, pagination) |
| GET | `/api/donations/:id` | Get single donation by ID |
| POST | `/api/donations/:id/refund` | Refund a donation |
| GET | `/api/donations/stats/summary` | Get donation statistics |

### Database Schema

**Donation Model:**
```javascript
{
  donor: ObjectId (ref: 'User'),
  project: ObjectId (ref: 'Project'),
  amount: Number,
  platformFee: Number (5%),
  stripeFee: Number (2.9% + $0.30),
  netAmount: Number,
  paymentIntentId: String,
  status: 'pending' | 'succeeded' | 'failed' | 'refunded',
  impactScore: Number,
  message: String,
  anonymous: Boolean,
  timestamps: true
}
```

##Configuration

### Environment Variables

Create a `.env` file in the `frontend` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
# For production:
# REACT_APP_API_URL=https://api.yourdomain.com/api
```

### Backend Connection

The API service automatically uses:
- **Development:** `http://localhost:5000/api`
- **Production:** Value from `REACT_APP_API_URL` environment variable

## Next Steps

### 1. Complete Dashboard Integration

Replace the mock `fetchDonations` function in `UserDashboard.tsx` with the real API call pattern provided in the TODO comments.

### 2. Add Authentication

Implement user authentication to get the current user's email:
```javascript
import { useAuth } from '../context/AuthContext';

const { user } = useAuth();
const data = await getUserImpact(user.email);
```

### 3. Integrate Other Pages

- **Discover Page:** Use `getCharities()` to display charity listings
- **Donate Page:** Use `createDonation()` for payment processing
- **Charity Profile:** Use `getCharityById()` and `getCharityDonations()`

### 4. Error Handling

Add user-friendly error messages:
```javascript
try {
  await createDonation(data);
  toast.success('Donation successful!');
} catch (error) {
  toast.error(error.response?.data?.message || 'Donation failed');
}
```

### 5. Loading States

Implement loading indicators for better UX:
```javascript
const [loading, setLoading] = useState(false);

if (loading) return <LoadingSpinner />;
```

## Testing

### 1. Start Backend Server
```bash
cd backend
npm install
npm start
```

### 2. Start Frontend
```bash
cd frontend
npm install
npm start
```

### 3. Test API Integration
- Open browser console
- Navigate to dashboard
- Check for API calls in Network tab
- Verify data is fetched correctly

## Troubleshooting

### CORS Issues
If you see CORS errors, ensure the backend has CORS configured:
```javascript
app.use(cors({
  origin: 'http://localhost:3000'
}));
```

### 404 Errors
- Verify backend server is running
- Check `REACT_APP_API_URL` is correct
- Confirm API endpoints match backend routes

### Authentication Errors
- Implement user authentication
- Pass user token in API headers
- Update API service to include auth token

## Files Created/Modified

1. **NEW:** `frontend/src/services/api.js` - API client service
2. **MODIFIED:** `frontend/src/pages/UserDashboard.tsx` - Added API imports and integration guide
3. **REVIEWED:** `frontend/src/components/Header/Header.js` - Dashboard link confirmed
4. **REVIEWED:** `backend/routes/donations.js` - API endpoints documented
5. **REVIEWED:** `backend/models/Donation.js` - Database schema documented

## Summary

The frontend-backend integration infrastructure is now in place. The API service provides a clean, documented interface for all backend operations. The dashboard has been prepared with integration examples, and developers can now complete the integration by following the patterns provided.

**Status:** ✅ Infrastructure Complete | 🔄 Integration In Progress | ⏳ Testing Pending

# ImpactLink API Integration Guide

## Overview
This guide provides comprehensive instructions for implementing the ImpactLink REST API with JWT authentication.

## Architecture

### Tech Stack
- **Frontend**: React 18 with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens
- **Payment**: Stripe API
- **Deployment**: Docker + GitHub Actions

---

## Frontend API Service Layer

### Step 1: Create services/api.ts

```typescript
// frontend/src/services/api.ts

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Authentication
  auth = {
    signup: (email: string, password: string, name: string) =>
      this.request<{ token: string; user: any }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }),

    login: (email: string, password: string) =>
      this.request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    logout: () => this.request('/auth/logout', { method: 'POST' }),

    refreshToken: () =>
      this.request<{ token: string }>('/auth/refresh', {
        method: 'POST',
      }),
  };

  // Charities
  charities = {
    getAll: () =>
      this.request<any[]>('/charities'),

    getById: (id: string) =>
      this.request<any>(`/charities/${id}`),

    search: (query: string) =>
      this.request<any[]>(`/charities/search?q=${query}`),

    getStats: (id: string) =>
      this.request<any>(`/charities/${id}/stats`),
  };

  // Donations
  donations = {
    create: (charityId: string, amount: number, paymentMethodId: string) =>
      this.request<{ donationId: string }>('/donations', {
        method: 'POST',
        body: JSON.stringify({ charityId, amount, paymentMethodId }),
      }),

    getHistory: () =>
      this.request<any[]>('/donations/history'),

    getById: (id: string) =>
      this.request<any>(`/donations/${id}`),
  };

  // Users
  users = {
    getProfile: () =>
      this.request<any>('/users/profile'),

    updateProfile: (data: any) =>
      this.request<any>('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    getDashboard: () =>
      this.request<any>('/users/dashboard'),
  };

  // Payments
  payments = {
    createPaymentIntent: (amount: number) =>
      this.request<{ clientSecret: string }>('/payments/intent', {
        method: 'POST',
        body: JSON.stringify({ amount }),
      }),

    confirmPayment: (paymentIntentId: string) =>
      this.request('/payments/confirm', {
        method: 'POST',
        body: JSON.stringify({ paymentIntentId }),
      }),
  };
}

export const apiClient = new ApiClient();
```

### Step 2: Create useApi Hook

```typescript
// frontend/src/hooks/useApi.ts

import { useState, useCallback } from 'react';
import { apiClient } from '../services/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (apiCall: Promise<T>) => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await apiCall;
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState({ data: null, loading: false, error: message });
      throw error;
    }
  }, []);

  return { ...state, execute };
}
```

### Step 3: Update Home.tsx to Use API

```typescript
// frontend/src/pages/Home.tsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../services/api';
import './Home.css';

interface Charity {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

interface ImpactStats {
  charitiesCount: number;
  totalDonations: number;
  activeDonors: number;
}

const Home: React.FC = () => {
  const [stats, setStats] = useState<ImpactStats>({
    charitiesCount: 0,
    totalDonations: 0,
    activeDonors: 0,
  });
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch charities
      const charitiesData = await apiClient.charities.getAll();
      setCharities(charitiesData);

      // Calculate stats
      const stats = {
        charitiesCount: charitiesData.length,
        totalDonations: charitiesData.reduce(
          (sum, c) => sum + (c.totalDonations || 0),
          0
        ),
        activeDonors: charitiesData.reduce(
          (sum, c) => sum + (c.donorCount || 0),
          0
        ),
      };
      setStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

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

      {error && <div className="error-message">{error}</div>}

      <section className="stats">
        <h2>Our Impact</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{stats.charitiesCount.toLocaleString()}+</h3>
              <p>Verified Charities</p>
            </div>
            <div className="stat-card">
              <h3>${(stats.totalDonations / 1000000).toFixed(1)}M+</h3>
              <p>Donations Processed</p>
            </div>
            <div className="stat-card">
              <h3>{stats.activeDonors.toLocaleString()}+</h3>
              <p>Active Donors</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
```

---

## Backend API Endpoints

### Authentication Endpoints

```
POST /api/auth/signup
Body: { email, password, name }
Response: { token, user }

POST /api/auth/login
Body: { email, password }
Response: { token, user }

POST /api/auth/logout
Headers: { Authorization: Bearer <token> }
Response: { success: boolean }

POST /api/auth/refresh
Headers: { Authorization: Bearer <token> }
Response: { token }
```

### Charities Endpoints

```
GET /api/charities
Response: [{ id, name, description, imageUrl, stats }]

GET /api/charities/:id
Response: { id, name, description, imageUrl, stats, donations }

GET /api/charities/search?q=query
Response: [{ id, name, description }]

GET /api/charities/:id/stats
Response: { totalDonations, donorCount, verified }
```

### Donations Endpoints

```
POST /api/donations
Headers: { Authorization: Bearer <token> }
Body: { charityId, amount, paymentMethodId }
Response: { donationId, status, timestamp }

GET /api/donations/history
Headers: { Authorization: Bearer <token> }
Response: [{ id, charityId, amount, timestamp, status }]

GET /api/donations/:id
Headers: { Authorization: Bearer <token> }
Response: { id, charityId, amount, timestamp, status }
```

### Users Endpoints

```
GET /api/users/profile
Headers: { Authorization: Bearer <token> }
Response: { id, email, name, role, createdAt }

PUT /api/users/profile
Headers: { Authorization: Bearer <token> }
Body: { name, email, preferences }
Response: { id, email, name, role }

GET /api/users/dashboard
Headers: { Authorization: Bearer <token> }
Response: { donations, stats, recommendations }
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": "error_code",
  "message": "Human readable error message"
}
```

### Common Error Codes

- `INVALID_CREDENTIALS` - Login failed
- `EMAIL_EXISTS` - Email already registered
- `UNAUTHORIZED` - Missing/invalid token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Request validation failed
- `PAYMENT_ERROR` - Payment processing failed
- `SERVER_ERROR` - Internal server error

---

## Testing the API

### Using curl

```bash
# Sign up
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John"}'

# Get charities
curl -X GET http://localhost:3001/api/charities

# Make donation (with token)
curl -X POST http://localhost:3001/api/donations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"charityId":"123","amount":5000}'
```

---

## Security Best Practices

1. **Token Storage**: Store tokens in httpOnly cookies (not localStorage)
2. **CORS**: Configure CORS to allow only trusted domains
3. **Rate Limiting**: Implement rate limiting on all endpoints
4. **Input Validation**: Validate all user inputs server-side
5. **SQL Injection Prevention**: Use Prisma ORM (prevents by default)
6. **HTTPS Only**: Always use HTTPS in production
7. **Secure Headers**: Set security headers (HSTS, CSP, etc.)
8. **Token Expiration**: Set short expiration (15 minutes) with refresh tokens

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Security headers set
- [ ] HTTPS certificate installed
- [ ] API documentation generated
- [ ] Integration tests passing
- [ ] Load testing completed
- [ ] Monitoring alerts set up

---

**Last Updated**: November 11, 2025  
**Version**: 1.0  
**Status**: Ready for Implementation

# ImpactLink Testing & QA Framework

## Overview

This document provides a comprehensive testing strategy for the ImpactLink MVP platform, covering unit tests, integration tests, end-to-end tests, and manual QA procedures. The framework ensures quality implementation of all features documented in GitHub Issues #1-#4.

## Testing Stack

### Frontend Testing
- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Cypress or Playwright
- **Type Safety**: TypeScript
- **Coverage Target**: 80%+ for critical paths

### Backend Testing
- **Unit Tests**: Jest + Node.js
- **Integration Tests**: Jest with database seeding
- **API Testing**: Thunder Client / Postman
- **Coverage Target**: 85%+ for API endpoints

## Phase 1: Critical Path Testing (Priority 1-2)

### 1.1 Git Case Sensitivity Fix - Verification Tests

**Manual Verification**
```bash
# After applying the git case sensitivity fix, verify:

# Check file names are correct
ls -la frontend/src/pages/ | grep -i home
ls -la frontend/src/pages/ | grep -i discover

# Verify git index is clean
git status

# Test build on Linux (if available)
cd frontend
npm install
npm run build

# Verify no import errors
npm run lint
```

**Automated Test**
```typescript
// frontend/__tests__/imports.test.ts
import { describe, it, expect } from '@jest/globals';

describe('File Path Case Sensitivity', () => {
  it('should import Home component successfully', () => {
    // Dynamic import to verify path resolution
    const Home = require('../src/pages/Home').default;
    expect(Home).toBeDefined();
  });

  it('should import Discover component successfully', () => {
    const Discover = require('../src/pages/Discover').default;
    expect(Discover).toBeDefined();
  });

  it('should import Dashboard component successfully', () => {
    const Dashboard = require('../src/pages/Dashboard').default;
    expect(Dashboard).toBeDefined();
  });
});
```

### 1.2 Frontend Navigation Testing

**Cypress E2E Test**
```typescript
// frontend/cypress/e2e/navigation.cy.ts

describe('Frontend Navigation', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  describe('Primary Navigation', () => {
    it('should navigate from Home to Donate', () => {
      cy.get('[data-testid="nav-donate"]').click();
      cy.url().should('include', '/donate');
      cy.get('h1').should('contain', 'Donate');
    });

    it('should navigate from Home to Discover', () => {
      cy.get('[data-testid="nav-discover"]').click();
      cy.url().should('include', '/discover');
      cy.get('h1').should('contain', 'Discover');
    });

    it('should navigate to Dashboard when authenticated', () => {
      cy.login('test@example.com', 'password123');
      cy.get('[data-testid="nav-dashboard"]').click();
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Button Navigation', () => {
    it('should navigate when clicking CTA buttons', () => {
      cy.get('[data-testid="btn-donate-now"]').click();
      cy.url().should('include', '/donate');
    });
  });
});
```

## Phase 2: Authentication Testing (Priority 3)

### 2.1 Unit Tests for Auth Components

```typescript
// frontend/__tests__/pages/Signup.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Signup from '../src/pages/Signup';

describe('Signup Component', () => {
  it('should render signup form', () => {
    render(<Signup />);
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    render(<Signup />);
    const emailInput = screen.getByPlaceholderText('Email');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(screen.getByText('Sign Up'));
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    render(<Signup />);
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'TestPassword123!' }
    });
    fireEvent.click(screen.getByText('Sign Up'));
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });
});
```

### 2.2 Backend Auth API Tests

```typescript
// backend/__tests__/api/auth.test.ts
import request from 'supertest';
import app from '../../src/app';
import { User } from '../../src/models/User';

describe('Authentication API', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/signup', () => {
    it('should create new user and return JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
          name: 'Test User'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
          name: 'Test User'
        });
      
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
          name: 'Test User 2'
        });
      
      expect(response.status).toBe(409);
      expect(response.body.error).toContain('Email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
          name: 'Test User'
        });
    });

    it('should return JWT token for valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid credentials');
    });
  });
});
```

## Phase 3: Payment Integration Testing (Priority 4-5)

### 3.1 Stripe Integration Tests

```typescript
// backend/__tests__/api/payments.test.ts
import request from 'supertest';
import app from '../../src/app';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

describe('Payment API', () => {
  let authToken: string;

  beforeEach(async () => {
    // Create test user and get token
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'donor@example.com',
        password: 'TestPassword123!',
        name: 'Test Donor'
      });
    authToken = signupRes.body.token;
  });

  describe('POST /api/donations', () => {
    it('should create donation with valid Stripe token', async () => {
      // Use Stripe test token
      const response = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          charityId: 'charity-123',
          amount: 5000, // $50.00
          stripeToken: 'tok_visa' // Stripe test token
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('donationId');
      expect(response.body.amount).toBe(5000);
    });

    it('should decline invalid Stripe token', async () => {
      const response = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          charityId: 'charity-123',
          amount: 5000,
          stripeToken: 'tok_chargeDeclinedvisa'
        });
      
      expect(response.status).toBe(402);
      expect(response.body.error).toContain('Card declined');
    });
  });
});
```

## Test Execution Setup

### Frontend Tests
```bash
# Install dependencies
cd frontend
npm install --save-dev jest @testing-library/react @testing-library/jest-dom cypress

# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

### Backend Tests
```bash
cd backend
npm install --save-dev jest @types/jest supertest

# Run tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- auth.test.ts
```

## CI/CD Integration

### GitHub Actions Test Workflow
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Frontend Tests
        run: |
          cd frontend
          npm install
          npm run test:coverage
      
      - name: Backend Tests
        run: |
          cd backend
          npm install
          npm run test:coverage
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v2
```

## QA Checklist Before Release

### Functional Testing
- [ ] All navigation links work correctly
- [ ] Signup/Login flows complete successfully
- [ ] Donation process from start to finish
- [ ] JWT token refresh works properly
- [ ] Error messages display clearly
- [ ] Loading states show appropriately

### Security Testing
- [ ] Passwords never logged or exposed
- [ ] JWT tokens properly validated
- [ ] CORS properly configured
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] Rate limiting working on API endpoints

### Performance Testing
- [ ] Page load times < 3 seconds
- [ ] API responses < 500ms
- [ ] No memory leaks detected
- [ ] Database queries optimized

### Browser Compatibility
- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Mobile Safari iOS
- [ ] Chrome Mobile Android

## Continuous Improvement

After each release phase:
1. Review test coverage metrics
2. Identify gaps in testing
3. Add tests for reported bugs
4. Update test framework as needed
5. Share lessons learned with team

# ImpactLink Load Testing & Performance Optimization Guide

## Overview

This guide provides comprehensive procedures for load testing the ImpactLink MVP application and optimizing performance for production deployment on HostKing. Load testing ensures the system can handle expected traffic volumes and identifies bottlenecks before they impact users.

**Target Environment**: HostKing Hosting (cPanel-based)
**Technology Stack**: Node.js 18, PostgreSQL, Redis, Nginx
**Database**: PostgreSQL with optimized queries
**Cache Layer**: Redis for session and data caching

---

## 1. Load Testing Tools & Setup

### Recommended Tools

#### k6 - Modern Load Testing Framework
- **Installation**: `npm install -g k6` or via Docker
- **Language**: JavaScript-based DSL
- **Use Case**: API and endpoint performance testing
- **Advantages**: Real-time metrics, cloud testing support, easy scripting

#### Artillery - Flexible Load Testing Tool
- **Installation**: `npm install -g artillery`
- **Format**: YAML-based configuration
- **Use Case**: Comprehensive scenario testing
- **Advantages**: Plugin support, detailed reporting, team integration

#### Locust - Python-based Load Testing
- **Installation**: `pip install locust`
- **Use Case**: Complex user behavior simulation
- **Advantages**: Distributed load generation, web UI for live monitoring

### Environment Setup

```bash
# Install load testing tools
npm install -g k6 artillery
pip install locust

# Create dedicated load testing directory
mkdir load-tests
cd load-tests

# Initialize configurations
k6 init  # Creates k6-config.js
article init  # Creates artillery-config.yml
```

---

## 2. k6 Load Testing Scripts

### Basic API Load Test

```javascript
// load-tests/basic-api-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,  // Virtual users
  duration: '5m',  // Test duration
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95% < 500ms, 99% < 1000ms
    http_req_failed: ['rate<0.1'],  // Error rate < 10%
  },
};

export default function () {
  // Test donation endpoint
  const donationRes = http.post(
    'https://impactlink.solovedhelpinghands.org.za/api/donations',
    JSON.stringify({
      charityId: 'test-charity-1',
      amount: 50,
      paymentMethod: 'card'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(donationRes, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Test user endpoint
  const userRes = http.get('https://impactlink.solovedhelpinghands.org.za/api/users/profile');
  check(userRes, {
    'user endpoint ok': (r) => r.status === 200,
  });

  sleep(1);  // 1 second between requests
}
```

### Advanced Ramping Test

```javascript
// load-tests/ramping-test.js
export const options = {
  stages: [
    { duration: '2m', target: 100 },    // Ramp up to 100 users
    { duration: '5m', target: 100 },    // Hold at 100 users
    { duration: '2m', target: 200 },    // Ramp up to 200 users
    { duration: '5m', target: 200 },    // Hold at 200 users
    { duration: '2m', target: 0 },      // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
  },
};

// Add test implementation here
```

---

## 3. Artillery Configuration

### Basic Artillery Config

```yaml
# load-tests/artillery-config.yml
config:
  target: 'https://impactlink.solovedhelpinghands.org.za'
  phases:
    - duration: 60
      arrivalRate: 5
      rampTo: 50
      name: 'Warm up'
    - duration: 300
      arrivalRate: 50
      name: 'Sustained load'
    - duration: 60
      arrivalRate: 50
      rampTo: 0
      name: 'Ramp down'

scenarios:
  - name: 'Donation Flow'
    weight: 60
    flow:
      - get:
          url: '/api/charities'
      - think: 2
      - post:
          url: '/api/donations'
          json:
            charityId: 'test-123'
            amount: 50
      - think: 1
      - get:
          url: '/api/donations/history'

  - name: 'User Dashboard'
    weight: 40
    flow:
      - get:
          url: '/api/users/profile'
      - think: 1
      - get:
          url: '/api/users/stats'
      - think: 2
      - get:
          url: '/api/users/achievements'
```

---

## 4. Running Load Tests

### Execute k6 Test

```bash
# Basic run
k6 run load-tests/basic-api-test.js

# With cloud results
k6 run --cloud load-tests/basic-api-test.js

# Generate HTML report
k6 run --out json=results.json load-tests/basic-api-test.js
k6 convert results.json -o report.html
```

### Execute Artillery Test

```bash
# Basic run
article run load-tests/artillery-config.yml

# With detailed reporting
article run --target https://impactlink.solovedhelpinghands.org.za load-tests/artillery-config.yml -o results.json

# Generate report
article report results.json
```

---

## 5. Database Performance Optimization

### Query Optimization

```sql
-- Add missing indexes
CREATE INDEX idx_donations_user_id ON donations(user_id);
CREATE INDEX idx_donations_charity_id ON donations(charity_id);
CREATE INDEX idx_donations_created_at ON donations(created_at);
CREATE INDEX idx_users_email ON users(email);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM donations WHERE user_id = 123;

-- Track slow queries
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log queries > 1 second
```

### Connection Pooling

```javascript
// backend/config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  max: 20,                          // Maximum connections
  idleTimeoutMillis: 30000,        // Idle timeout
  connectionTimeoutMillis: 2000,   // Connection timeout
});

module.exports = pool;
```

---

## 6. Redis Caching Strategy

### Cache Configuration

```javascript
// backend/config/redis.js
const redis = require('redis');

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500)
  }
});

// Cache strategies
const CACHE_TTL = {
  USER_PROFILE: 3600,      // 1 hour
  CHARITIES: 7200,         // 2 hours
  DONATIONS: 1800,         // 30 minutes
  STATS: 300               // 5 minutes
};

module.exports = { client, CACHE_TTL };
```

### Caching Middleware

```javascript
// backend/middleware/cache.js
const { client, CACHE_TTL } = require('../config/redis');

const cacheMiddleware = (ttl) => async (req, res, next) => {
  const cacheKey = `${req.method}:${req.originalUrl}`;
  const cached = await client.get(cacheKey);

  if (cached) {
    return res.json(JSON.parse(cached));
  }

  const originalJson = res.json.bind(res);
  res.json = (data) => {
    client.setEx(cacheKey, ttl, JSON.stringify(data));
    return originalJson(data);
  };

  next();
};

module.exports = cacheMiddleware;
```

---

## 7. Performance Metrics & Monitoring

### Key Metrics to Track

- **Response Time**: p50, p95, p99 latencies
- **Throughput**: Requests per second (RPS)
- **Error Rate**: Failed requests percentage
- **CPU Usage**: Application server CPU
- **Memory Usage**: Heap and total memory
- **Database**: Query time, connection pool utilization
- **Cache Hit Rate**: Redis cache effectiveness

### Monitoring Dashboard Setup

```bash
# Install monitoring tools
npm install prometheus express-prometheus-middleware

# Configure Grafana for visualization
# Add Prometheus data source
# Create dashboards for performance tracking
```

---

## 8. Optimization Recommendations

### Application Level

- Implement pagination for large datasets
- Use database query caching with Redis
- Compress API responses (gzip)
- Implement rate limiting (50 req/min per IP)
- Add database connection pooling
- Optimize N+1 queries with JOINs

### Infrastructure Level

- Configure Nginx caching for static assets
- Enable HTTP/2 for faster connections
- Implement CDN for static content
- Load balance across multiple app instances
- Use connection pooling in reverse proxy

### Database Level

- Add query indexes on frequently filtered columns
- Implement query result caching
- Archive old transaction data
- Regular vacuum and analyze operations
- Monitor slow query log

---

## 9. Load Test Results Interpretation

### Acceptable Performance Thresholds

- **Response Time**: p95 < 500ms, p99 < 1000ms
- **Error Rate**: < 0.1% (less than 1 error per 1000 requests)
- **Throughput**: Minimum 100 RPS sustainable
- **CPU**: < 70% under sustained load
- **Memory**: < 80% heap utilization

### Bottleneck Identification

- High response times + Low CPU = Database bottleneck
- High response times + High CPU = Application bottleneck
- High error rate = System overload or misconfiguration
- Cache hit ratio < 50% = Inefficient caching strategy

---

## 10. Production Deployment Checklist

- [ ] Load tested with 200+ concurrent users
- [ ] Response time thresholds met (p95 < 500ms)
- [ ] Error rate below 0.1%
- [ ] Database indexes optimized and tested
- [ ] Redis caching configured and validated
- [ ] Rate limiting implemented
- [ ] Monitoring and alerting configured
- [ ] Disaster recovery tested
- [ ] Performance baselines documented
- [ ] Team trained on performance monitoring

---

**Last Updated**: November 10, 2025  
**Version**: 1.0.0  
**Status**: Production Ready

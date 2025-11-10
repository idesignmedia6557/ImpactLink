# ImpactLink Deployment Guide - Step 11

## Overview

This guide provides comprehensive instructions for deploying the ImpactLink MVP platform to production using HostKing hosting services.

**Deployment Target**: `impactlink.solovedhelpinghands.org.za`  
**Hosting Provider**: HostKing (cPanel)  
**Database**: PostgreSQL  
**Implementation Date**: November 10, 2025

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Frontend Deployment](#frontend-deployment)
3. [Backend Deployment](#backend-deployment)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [SSL/TLS Setup](#ssltls-setup)
7. [Domain Configuration](#domain-configuration)
8. [Post-Deployment Testing](#post-deployment-testing)
9. [Monitoring Setup](#monitoring-setup)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Access
- [x] HostKing cPanel access: https://my.hostking.host/clientarea.php?action=productdetails&id=19513
- [x] GitHub repository access
- [x] Stripe account (live mode keys)
- [x] Domain DNS management access

### Local Development Setup
- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- Git
- npm or yarn package manager

###  Build Tools
```bash
npm install
# or
yarn install
```

---

## Frontend Deployment

### Option 1: Static Build (Recommended)

#### Step 1: Build Frontend
```bash
cd frontend
npm run build
# Creates optimized production build in .next/ or out/
```

#### Step 2: Upload to HostKing
1. Access cPanel File Manager
2. Navigate to `public_html/impactlink/`
3. Upload contents of `out/` or `.next/` directory
4. Set correct file permissions (644 for files, 755 for directories)

### Option 2: Vercel Deployment (Alternative)

For better performance, consider deploying frontend to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

Then configure custom domain to point to Vercel.

---

## Backend Deployment

### Step 1: Prepare Backend Build

```bash
cd backend

# Install dependencies
npm install --production

# Build TypeScript (if applicable)
npm run build

# Test locally
NODE_ENV=production npm start
```

### Step 2: Upload to HostKing

#### Via FTP/SFTP:
1. Use FileZilla or cPanel File Manager
2. Upload to: `public_html/impactlink/backend/`
3. Include:
   - `package.json`
   - `package-lock.json`
   - `dist/` or `src/` directory
   - `.env` file (with production values)

#### Via Git (Recommended):
```bash
# On server (via SSH if available)
cd public_html/impactlink
git clone https://github.com/idesignmedia6557/ImpactLink.git .
npm install --production
```

### Step 3: Configure Node.js App in cPanel

1. **Access cPanel** → **Setup Node.js App**
2. **Create Application**:
   - Node.js Version: `18.x` or higher
   - Application Mode: `Production`
   - Application Root: `impactlink/backend`
   - Application URL: `impactlink.solovedhelpinghands.org.za`
   - Application Startup File: `server.js` or `dist/server.js`

3. **Set Environment Variables** (in cPanel Node.js App interface):
   ```
   NODE_ENV=production
   PORT=3000
   ```

4. **Start Application**

---

## Database Setup

### Step 1: Create PostgreSQL Database

1. **Access cPanel** → **PostgreSQL Databases**
2. **Create Database**:
   - Database Name: `impactlink_prod`
3. **Create User**:
   - Username: `impactlink_user`
   - Password: [Generate secure password]
4. **Grant Privileges**:
   - Select database: `impactlink_prod`
   - User: `impactlink_user`
   - Privileges: ALL

### Step 2: Note Connection Details

```
Host: localhost (or provided by HostKing)
Port: 5432
Database: impactlink_prod
User: impactlink_user
Password: [your-secure-password]
```

### Step 3: Run Database Migrations

```bash
# On server or locally with remote connection
cd backend

# Set DATABASE_URL
export DATABASE_URL="postgresql://impactlink_user:password@localhost:5432/impactlink_prod"

# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Seed database (optional)
npx prisma db seed
```

### Step 4: Verify Database Schema

Ensure all Step 10 models are created:
- UserLevel
- Achievement
- UserAchievement
- Challenge
- ChallengeParticipant
- Subscription
- MatchingProgram
- MatchedDonation
- FraudFlag
- KYCVerification

---

## Environment Configuration

### Create Production `.env` File

Create `backend/.env` with production values:

```env
# Application
NODE_ENV=production
PORT=3000
API_URL=https://impactlink.solovedhelpinghands.org.za/api

# Database
DATABASE_URL="postgresql://impactlink_user:password@localhost:5432/impactlink_prod"

# Authentication
JWT_SECRET="[generate-32-char-random-string]"
JWT_EXPIRES_IN="7d"

# Stripe (LIVE MODE)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
EMAIL_FROM="noreply@impactlink.solovedhelpinghands.org.za"
SMTP_HOST="[hostking-smtp-server]"
SMTP_PORT=587
SMTP_USER="[your-email]"
SMTP_PASS="[your-password]"

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR="/uploads"

# Security
CORS_ORIGIN="https://impactlink.solovedhelpinghands.org.za"
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Monitoring (Step 12)
SENTRY_DSN=""
LOG_LEVEL="info"
```

### Security Best Practices

1. **Never commit `.env` to Git**
2. **Use strong random strings** for secrets
3. **Rotate keys regularly**
4. **Limit file permissions**: `chmod 600 .env`
5. **Use environment variables** in cPanel Node.js App config

---

## SSL/TLS Setup

### Step 1: Enable AutoSSL in cPanel

1. **Access cPanel** → **SSL/TLS Status**
2. **Run AutoSSL** for `impactlink.solovedhelpinghands.org.za`
3. Wait for certificate issuance (Let's Encrypt)

### Step 2: Force HTTPS

Create `.htaccess` in `public_html/impactlink/`:

```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Security Headers
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"
Header set Strict-Transport-Security "max-age=31536000; includeSubDomains"
```

### Step 3: Verify SSL

Test at: https://www.ssllabs.com/ssltest/

---

## Domain Configuration

### DNS Settings

**For `impactlink.solovedhelpinghands.org.za`:**

```
Type: A Record
Name: impactlink
Value: [HostKing Server IP]
TTL: 3600
```

OR (if using CNAME):

```
Type: CNAME
Name: impactlink  
Value: ucikoevents.co.za
TTL: 3600
```

### Addon Domain in cPanel

1. **cPanel** → **Domains** → **Create New Domain**
2. **Domain**: `impactlink.solovedhelpinghands.org.za`
3. **Document Root**: `/public_html/impactlink`
4. **Create**

---

## Post-Deployment Testing

### Step 1: Smoke Tests

```bash
# Test API health
curl https://impactlink.solovedhelpinghands.org.za/api/health

# Test database connection
curl https://impactlink.solovedhelpinghands.org.za/api/status

# Test authentication
curl -X POST https://impactlink.solovedhelpinghands.org.za/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Step 2: Feature Tests

- [ ] User registration and login
- [ ] Browse projects
- [ ] Make test donation (Stripe test mode first!)
- [ ] Charity dashboard access
- [ ] Admin console functionality
- [ ] Gamification features
- [ ] Subscription creation
- [ ] Analytics endpoints

### Step 3: Performance Tests

```bash
# Use Apache Bench
ab -n 1000 -c 10 https://impactlink.solovedhelpinghands.org.za/api/projects

# Or use  
npx artillery quick --count 100 --num 10 https://impactlink.solovedhelpinghands.org.za
```

### Step 4: Security Tests

- [ ] SSL certificate valid
- [ ] HTTPS redirect working
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] SQL injection protection
- [ ] XSS protection headers

---

## Monitoring Setup

### Application Monitoring

1. **Install PM2** (Process Manager):
```bash
npm install -g pm2
pm2 start server.js --name impactlink
pm2 save
pm2 startup
```

2. **Configure Logging**:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Error Tracking (Sentry - Step 12)

```bash
npm install @sentry/node @sentry/tracing
```

Add to `server.js`:
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 1.0,
});
```

### Uptime Monitoring

- **UptimeRobot**: Free tier (5-minute checks)
- **StatusCake**: Free tier
- **Pingdom**: Paid

Monitor:
- `https://impactlink.solovedhelpinghands.org.za`
- `https://impactlink.solovedhelpinghands.org.za/api/health`

---

## Troubleshooting

### Issue: Node.js App Won't Start

**Solutions**:
1. Check Node.js version compatibility
2. Verify `package.json` scripts
3. Check cPanel error logs
4. Ensure all dependencies installed
5. Verify environment variables set

### Issue: Database Connection Failed

**Solutions**:
1. Verify DATABASE_URL format
2. Check PostgreSQL service running
3. Confirm user privileges
4. Test connection with `psql` command
5. Check firewall rules

### Issue: Stripe Webhooks Failing

**Solutions**:
1. Verify webhook endpoint URL
2. Check STRIPE_WEBHOOK_SECRET
3. Test with Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/subscriptions/webhook
   ```
4. Review webhook logs in Stripe Dashboard

### Issue: 502 Bad Gateway

**Solutions**:
1. Restart Node.js app
2. Check PM2 process status: `pm2 status`
3. Review error logs: `pm2 logs`
4. Verify port not conflicting
5. Check memory/CPU usage

### Issue: Slow Performance

**Solutions**:
1. Enable database connection pooling
2. Add Redis caching layer
3. Optimize database queries
4. Enable CDN for static assets
5. Implement API response caching

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing locally
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] Backup existing data
- [ ] SSL certificate ready
- [ ] Monitoring tools configured
- [ ] Error tracking setup

### Deployment
- [ ] Upload frontend build
- [ ] Upload backend code
- [ ] Create database
- [ ] Run migrations
- [ ] Configure environment variables
- [ ] Start Node.js application
- [ ] Enable SSL/HTTPS
- [ ] Configure domain DNS

### Post-Deployment
- [ ] Run smoke tests
- [ ] Verify all features
- [ ] Check error logs
- [ ] Test Stripe integration
- [ ] Verify email sending
- [ ] Test performance
- [ ] Configure backups
- [ ] Update documentation

---

## Additional Resources

### Documentation Links
- [HostKing cPanel Guide](https://my.hostking.host/knowledgebase)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Stripe Production Checklist](https://stripe.com/docs/keys#obtaining-api-keys)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/)

### Support Contacts
- **HostKing Support**: support@hostking.host
- **Project Lead**: [Your Contact]
- **GitHub Issues**: https://github.com/idesignmedia6557/ImpactLink/issues

---

**Deployment Guide Version**: 1.0  
**Last Updated**: November 10, 2025  
**Status**: Ready for Production Deployment  

---

*For Step 12 (Monitoring & Error Tracking) implementation, refer to the monitoring setup section and upcoming documentation.*

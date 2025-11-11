# HostKing Deployment Guide for ImpactLink

**CRITICAL FIX DEPLOYMENT - November 11, 2025**

This guide walks you through deploying the fixes for the 503 Service Unavailable error to your HostKing production server.

## Current Status

✅ **Fixes Completed & Committed to GitHub:**
- Fixed .htaccess API proxy from port 3000 → 5000
- Updated backend .env with production configuration
- Both commits are in the main branch and ready to deploy

## Pre-Deployment Checklist

- [ ] You have SSH access to HostKing
- [ ] You know your HostKing username/domain
- [ ] You have PostgreSQL credentials (database name, user, password)
- [ ] You have Git installed locally
- [ ] You have Node.js 18+ installed

## Deployment Steps

### Step 1: SSH into Your HostKing Server

Replace `yourusername` with your actual HostKing username:

```bash
ssh yourusername@impactlink.solovedhelpinghands.org.za
# Or use your server IP
ssh yourusername@your.hostking.ip
```

### Step 2: Navigate to Application Directory

```bash
cd ~/public_html/impactlink
ls -la
```

**Expected output:** You should see `backend/`, `frontend/`, `.htaccess`, and other files.

### Step 3: Pull Latest Code Changes

```bash
git pull origin main
```

**Verify:** You should see the two commits:
- "fix: Correct backend port from 3000 to 5000"
- "fix: Add production environment configuration"

### Step 4: Install Backend Dependencies

```bash
cd backend
npm install
```

**Time:** 2-5 minutes (first time takes longer)

### Step 5: Configure Environment Variables

First, check if .env exists:

```bash
ls -la | grep env
```

If `.env` doesn't exist, create it:

```bash
cp .env.example .env
```

Then edit `.env` with your actual credentials:

```bash
nano .env
```

**Update these critical values:**

```
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://impactlink.solovedhelpinghands.org.za
BACKEND_URL=https://impactlink.solovedhelpinghands.org.za
CORS_ORIGIN=https://impactlink.solovedhelpinghands.org.za

# Database (from HostKing panel)
DATABASE_URL=postgresql://username:password@localhost:5432/impactlink_db

# Generate secure JWT secrets or use existing ones
JWT_SECRET=your-secure-random-string
JWT_REFRESH_SECRET=your-secure-random-string
```

**To save in nano:** Press `Ctrl+O`, then `Enter`, then `Ctrl+X`

### Step 6: Run Database Migrations

```bash
cd ~/public_html/impactlink/backend
npm run migrate
npm run generate
```

**If migrations fail:**
- Check `DATABASE_URL` format
- Verify database exists in HostKing panel
- Verify user has privileges to the database

### Step 7: Test Backend Server Locally

```bash
# Start the backend server
npm start
```

**Expected output:** Should see something like:
```
=================================
 ImpactLink API Server
=================================
Environment: production
Server running on port 5000
API URL: http://localhost:5000
=================================
```

**Press Ctrl+C to stop the server**

### Step 8: Restart Passenger Application (in cPanel)

1. Log in to HostKing control panel
2. Go to **Passenger** section
3. Find **ImpactLink** application
4. Click **Restart**

Or via SSH:

```bash
passenger-config restart-app /home/yourusername/public_html/impactlink
```

### Step 9: Verify .htaccess is Updated

Check the API proxy configuration:

```bash
grep "localhost:5000" ~/public_html/impactlink/.htaccess
```

**Expected:** Should show lines with `localhost:5000`

### Step 10: Test the Deployment

**Test 1: Health Check Endpoint**

```bash
curl https://impactlink.solovedhelpinghands.org.za/health
```

**Expected output:** JSON with status OK

```json
{
  "status": "OK",
  "timestamp": "2025-11-11T...",
  "uptime": 123.45,
  "environment": "production"
}
```

**Test 2: API Root Endpoint**

```bash
curl https://impactlink.solovedhelpinghands.org.za/api
```

**Expected:** JSON with API information

**Test 3: Browser Test**

Visit: `https://impactlink.solovedhelpinghands.org.za`

- Should NOT show 503 error
- Should show your ImpactLink homepage
- CTA buttons should load without errors

## Troubleshooting

### Still Getting 503 Error?

**Check 1: Passenger Status**

```bash
passenger-status
```

Look for the ImpactLink app status - should be "RUNNING"

**Check 2: Backend Port Conflict**

```bash
lsof -i :5000
```

Should show only the Node.js process. If nothing, backend isn't running.

**Check 3: Error Logs**

```bash
# Passenger logs
tail -f /home/yourusername/logs/passenger.log

# Passenger errors
ls -la /var/log/apache2/error_log

# Node logs
cd ~/public_html/impactlink/backend && npm start
```

**Check 4: Database Connection**

```bash
# Test PostgreSQL connection
psql -h localhost -U impactlink_user -d impactlink_db -c "SELECT version();"
```

Should show PostgreSQL version without errors.

### npm Dependency Issues?

```bash
cd backend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Still Need Help?

Check the logs:

```bash
# Real-time passenger log
tail -f ~/logs/passenger.log

# Backend server test
cd ~/public_html/impactlink/backend
NODE_ENV=production npm start
```

## Success Indicators

✅ You should see:
- No 503 error on https://impactlink.solovedhelpinghands.org.za
- Health endpoint returns JSON
- Homepage loads with content
- No console errors in browser DevTools
- Network tab shows successful API calls

## Rollback (If Something Goes Wrong)

```bash
cd ~/public_html/impactlink
git revert HEAD --no-edit
npm install
# Restart Passenger
passenger-config restart-app /home/yourusername/public_html/impactlink
```

## Next Steps After Successful Deployment

1. Monitor error logs for 24 hours
2. Test the full donation flow
3. Verify payment processing works
4. Check that charities can register
5. Test user authentication

## Support Resources

- HostKing Control Panel: https://my.hostking.host/clientarea.php
- GitHub Repository: https://github.com/idesignmedia6557/ImpactLink
- Backend Setup: See `backend/README.md`
- Database Help: See `STEP11_DEPLOYMENT_README.md`

---

**Deployment Date:** November 11, 2025
**Status:** Ready for Production
**Estimated Time:** 15-20 minutes

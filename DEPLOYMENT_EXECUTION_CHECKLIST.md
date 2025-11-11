# ImpactLink Deployment Execution Checklist

**DEPLOYMENT DATE:** November 11, 2025  
**STATUS:** Ready for Immediate Execution  
**ESTIMATED TIME:** 15-20 minutes  
**CRITICAL ISSUE BEING FIXED:** 503 Service Unavailable Error

---

## Pre-Deployment Requirements

Before you start, ensure you have:

- [ ] SSH access to HostKing (yourusername@impactlink.solovedhelpinghands.org.za)
- [ ] HostKing username and password
- [ ] PostgreSQL database credentials (database name, user, password)
- [ ] Terminal/SSH client ready (PuTTY on Windows, Terminal on Mac/Linux)
- [ ] Your GitHub repository URL: https://github.com/idesignmedia6557/ImpactLink

---

## Deployment Execution Steps

### PHASE 1: SERVER CONNECTION & CODE PULL

#### Step 1: Connect to HostKing via SSH

```bash
ssh yourusername@impactlink.solovedhelpinghands.org.za
# OR use IP: ssh yourusername@your.hostking.ip
# OR use main domain: ssh yourusername@ucikoevents.co.za
```

**Expected:** You should be logged into the server  
**Status:** [ ] Complete

---

#### Step 2: Navigate to Application Directory

```bash
cd ~/public_html/impactlink
ls -la
```

**Expected Output:** You should see:
- `backend/` folder
- `frontend/` folder
- `.htaccess` file
- `.env.example` file
- `node_modules/` folder (may or may not exist)

**Status:** [ ] Complete

---

#### Step 3: Pull Latest Code Changes

```bash
git pull origin main
```

**Expected Output:** Should show these two commits:
1. "fix: Correct backend port from 3000 to 5000 in .htaccess API proxy"
2. "fix: Add production environment configuration for HostKing deployment"
3. "docs: Add HostKing deployment guide with 503 fix instructions"

**Status:** [ ] Complete

---

### PHASE 2: BACKEND SETUP

#### Step 4: Navigate to Backend Directory

```bash
cd backend
pwd
```

**Expected:** Should show path ending with `/public_html/impactlink/backend`

**Status:** [ ] Complete

---

#### Step 5: Check/Create .env File

```bash
ls -la | grep env
```

**If .env doesn't exist:**
```bash
cp .env.example .env
```

**Status:** [ ] Complete

---

#### Step 6: Edit .env with Production Configuration

```bash
nano .env
```

**Update these CRITICAL values:**
```
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://impactlink.solovedhelpinghands.org.za
BACKEND_URL=https://impactlink.solovedhelpinghands.org.za
CORS_ORIGIN=https://impactlink.solovedhelpinghands.org.za

# Database Configuration (from HostKing Control Panel)
DATABASE_URL=postgresql://username:password@localhost:5432/impactlink_db

# JWT Secrets (use secure random strings)
JWT_SECRET=your-secure-random-string-here
JWT_REFRESH_SECRET=your-other-secure-random-string
```

**To Save in Nano:**
1. Press `Ctrl+O` (write out)
2. Press `Enter` (confirm filename)
3. Press `Ctrl+X` (exit)

**Status:** [ ] Complete

---

#### Step 7: Install Dependencies

```bash
npm install
```

**Expected:** This will take 2-5 minutes. Watch for:
- No major errors (warnings are OK)
- Final message about vulnerabilities (usually safe to ignore)
- `node_modules/` folder created

**If it fails:**
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Status:** [ ] Complete

---

### PHASE 3: DATABASE & VERIFICATION

#### Step 8: Run Database Migrations

```bash
npm run migrate
npm run generate
```

**Expected:** Database tables created successfully  
**Time:** 30 seconds - 2 minutes

**If this fails:**
- Check DATABASE_URL in .env
- Verify database exists in HostKing Control Panel
- Verify PostgreSQL user has correct privileges

**Status:** [ ] Complete

---

#### Step 9: Test Backend Server

```bash
NODE_ENV=production npm start
```

**Expected Output:** Should show:
```
=================================
ImpactLink API Server
=================================
Environment: production
Server running on port 5000
API URL: http://localhost:5000
=================================
```

**STOP THE SERVER:** Press `Ctrl+C`

**Status:** [ ] Complete

---

#### Step 10: Return to Root Directory

```bash
cd ~/public_html/impactlink
```

**Status:** [ ] Complete

---

### PHASE 4: PASSENGER RESTART & VERIFICATION

#### Step 11: Verify .htaccess is Updated

```bash
grep "localhost:5000" .htaccess
```

**Expected:** Should show at least 3 lines with `localhost:5000` in them:
- API proxy rule
- Webhooks endpoint
- Health check endpoint

**Status:** [ ] Complete

---

#### Step 12: Check Passenger Status

```bash
passenger-status
```

**Expected:** Should show ImpactLink application status

**Status:** [ ] Complete

---

#### Step 13: Restart Passenger Application

**Option A: Via cPanel (Recommended)**
1. Log into HostKing Control Panel: https://my.hostking.host/clientarea.php?action=productdetails&id=19513
2. Look for Passenger section
3. Find ImpactLink application
4. Click "Restart"

**Option B: Via SSH Command**
```bash
passenger-config restart-app /home/yourusername/public_html/impactlink
```

**Expected:** Application restarts without errors

**Status:** [ ] Complete

---

### PHASE 5: DEPLOYMENT VERIFICATION

#### Step 14: Test Health Endpoint

```bash
curl https://impactlink.solovedhelpinghands.org.za/health
```

**Expected Output:** JSON response:
```json
{
  "status": "OK",
  "timestamp": "2025-11-11T19:30:00Z",
  "uptime": 123.45,
  "environment": "production"
}
```

**Status:** [ ] Complete

---

#### Step 15: Test API Root Endpoint

```bash
curl https://impactlink.solovedhelpinghands.org.za/api
```

**Expected:** JSON API information (should NOT be a 503 error)

**Status:** [ ] Complete

---

#### Step 16: Browser Test - Critical!

**Test in Web Browser:**

1. Visit: `https://impactlink.solovedhelpinghands.org.za`

**Check for:**
- [ ] Page loads WITHOUT 503 error
- [ ] Homepage content displays
- [ ] CTA buttons visible
- [ ] No console errors (check DevTools → Console tab)
- [ ] Network tab shows successful API calls (200/201 status codes)

**If you see 503 error:** Go to TROUBLESHOOTING section below

**Status:** [ ] Complete

---

## Success Checklist - Deployment is Complete When:

✅ All 16 steps completed successfully  
✅ Health endpoint returns JSON (not 503)  
✅ Homepage loads in browser  
✅ No 503 errors visible anywhere  
✅ Browser DevTools Console has no major errors  

---

## Troubleshooting - If Something Goes Wrong

### Still Seeing 503 Error?

**Check 1: Is Passenger Running?**
```bash
passenger-status
```
Look for ImpactLink app status - should be "RUNNING"

**Fix:** Restart Passenger via cPanel or:
```bash
passenger-config restart-app /home/yourusername/public_html/impactlink
```

---

**Check 2: Is Backend Running on Port 5000?**
```bash
lsof -i :5000
```

Should show Node.js process. If nothing:
- Backend isn't running
- Try restarting Passenger

---

**Check 3: Check Error Logs**
```bash
# Real-time Passenger logs
tail -f ~/logs/passenger.log

# Backend test (will show detailed errors)
cd ~/public_html/impactlink/backend
NODE_ENV=production npm start
```

Press `Ctrl+C` to stop

---

**Check 4: Verify Database Connection**
```bash
psql -h localhost -U impactlink_user -d impactlink_db -c "SELECT version();"
```

Should show PostgreSQL version without errors

---

**Check 5: .htaccess Syntax Error?**
```bash
cat ~/public_html/impactlink/.htaccess | head -20
```

Should show proper Apache configuration, not errors

---

## Rollback - If You Need to Undo

**If deployment causes critical issues:**

```bash
cd ~/public_html/impactlink
git revert HEAD --no-edit
npm install
passenger-config restart-app /home/yourusername/public_html/impactlink
```

This will revert to the previous working state.

---

## What Was Fixed

1. **Fixed .htaccess API Proxy Port**
   - Changed: `localhost:3000` → `localhost:5000`
   - This was causing 503 errors because API requests were routing to the wrong port

2. **Updated Backend .env for Production**
   - Added proper production environment configuration
   - Set NODE_ENV=production
   - Configured CORS for production domain
   - Added database connection template

3. **Added Comprehensive Deployment Guide**
   - HOSTKING_DEPLOYMENT_GUIDE.md for reference
   - This checklist for step-by-step execution

---

## Next Steps After Successful Deployment

1. Monitor error logs for 24 hours
2. Test the full donation flow end-to-end
3. Verify payment processing works
4. Check charity registration
5. Test user authentication

---

## Support Resources

- HostKing Control Panel: https://my.hostking.host/clientarea.php?action=productdetails&id=19513
- GitHub Repository: https://github.com/idesignmedia6557/ImpactLink
- Main Deployment Guide: HOSTKING_DEPLOYMENT_GUIDE.md
- Backend Setup: backend/README.md

---

**DEPLOYMENT INITIATED:** November 11, 2025 at 7:00 PM SAST  
**ESTIMATED COMPLETION:** November 11, 2025 at 7:15-7:20 PM SAST

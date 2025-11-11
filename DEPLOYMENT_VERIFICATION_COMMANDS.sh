#!/bin/bash

# ImpactLink Deployment Verification Commands
# Run these commands after deployment to verify everything is working
# Copy and paste each section into your SSH terminal

echo "========================================"
echo "ImpactLink Deployment Verification Suite"
echo "========================================"
echo ""

# Configuration - UPDATE THESE WITH YOUR VALUES
DOMAIN="impactlink.solovedhelpinghands.org.za"
APP_PATH="/home/yourusername/public_html/impactlink"
BACKEND_PORT=5000

echo "Configuration:"
echo "Domain: $DOMAIN"
echo "App Path: $APP_PATH"
echo "Backend Port: $BACKEND_PORT"
echo ""

# ============================================================================
# TEST 1: Verify .htaccess has correct port
# ============================================================================
echo "[TEST 1] Verifying .htaccess configuration..."
echo "Command: grep 'localhost:5000' $APP_PATH/.htaccess"
echo ""

grep "localhost:5000" $APP_PATH/.htaccess

if [ $? -eq 0 ]; then
    echo "✅ SUCCESS: .htaccess correctly configured for port 5000"
else
    echo "❌ FAILURE: .htaccess does not contain localhost:5000"
    echo "Check: grep -n 'localhost' $APP_PATH/.htaccess"
fi
echo ""
echo "---"
echo ""

# ============================================================================
# TEST 2: Check if backend is running on port 5000
# ============================================================================
echo "[TEST 2] Checking backend server on port $BACKEND_PORT..."
echo "Command: lsof -i :$BACKEND_PORT"
echo ""

lsof -i :$BACKEND_PORT

if [ $? -eq 0 ]; then
    echo "✅ SUCCESS: Node.js process detected on port $BACKEND_PORT"
else
    echo "❌ FAILURE: No process found on port $BACKEND_PORT"
    echo "Action: Backend server may not be running. Check Passenger status:"
    echo "        passenger-status"
fi
echo ""
echo "---"
echo ""

# ============================================================================
# TEST 3: Check Passenger application status
# ============================================================================
echo "[TEST 3] Checking Passenger application status..."
echo "Command: passenger-status | grep -A 5 impactlink"
echo ""

passenger-status | grep -A 5 impactlink

if [ $? -eq 0 ]; then
    echo "✅ SUCCESS: Passenger status retrieved"
else
    echo "❌ FAILURE: Could not get Passenger status"
fi
echo ""
echo "---"
echo ""

# ============================================================================
# TEST 4: Test Health Endpoint
# ============================================================================
echo "[TEST 4] Testing health endpoint..."
echo "URL: https://$DOMAIN/health"
echo ""

curl -s -w "\nHTTP Status: %{http_code}\n" "https://$DOMAIN/health" | head -20

echo ""
echo "Expected: JSON response with 'status': 'OK' and HTTP 200"
echo ""
echo "---"
echo ""

# ============================================================================
# TEST 5: Test API Root Endpoint
# ============================================================================
echo "[TEST 5] Testing API root endpoint..."
echo "URL: https://$DOMAIN/api"
echo ""

curl -s -w "\nHTTP Status: %{http_code}\n" "https://$DOMAIN/api" | head -20

echo ""
echo "Expected: JSON response with HTTP 200 (NOT 503)"
echo ""
echo "---"
echo ""

# ============================================================================
# TEST 6: Check database connection
# ============================================================================
echo "[TEST 6] Testing database connection..."
echo "Command: psql -h localhost -U impactlink_user -d impactlink_db -c 'SELECT version();'"
echo ""

psql -h localhost -U impactlink_user -d impactlink_db -c "SELECT version();"

if [ $? -eq 0 ]; then
    echo "✅ SUCCESS: Database connection verified"
else
    echo "❌ FAILURE: Could not connect to database"
    echo "Check:"
    echo "  - Database exists: impactlink_db"
    echo "  - User has privileges: impactlink_user"
    echo "  - PostgreSQL is running"
fi
echo ""
echo "---"
echo ""

# ============================================================================
# TEST 7: Check error logs
# ============================================================================
echo "[TEST 7] Checking recent error logs..."
echo "Command: tail -n 20 ~/logs/passenger.log"
echo ""

tail -n 20 ~/logs/passenger.log

echo ""
echo "---"
echo ""

# ============================================================================
# TEST 8: Verify recent git commits
# ============================================================================
echo "[TEST 8] Verifying git commits..."
echo "Command: git log --oneline -5"
echo ""

cd $APP_PATH
git log --oneline -5

echo ""
echo "Expected: Should include commits for:"
echo "  - fix: Correct backend port from 3000 to 5000 in .htaccess"
echo "  - fix: Add production environment configuration"
echo ""
echo "---"
echo ""

# ============================================================================
# TEST 9: Verify .env configuration
# ============================================================================
echo "[TEST 9] Checking backend environment configuration..."
echo "Command: grep -E '^(NODE_ENV|PORT|FRONTEND_URL|BACKEND_URL|CORS_ORIGIN)' $APP_PATH/backend/.env"
echo ""

grep -E '^(NODE_ENV|PORT|FRONTEND_URL|BACKEND_URL|CORS_ORIGIN)' $APP_PATH/backend/.env

echo ""
echo "Expected:"
echo "  NODE_ENV=production"
echo "  PORT=5000"
echo "  FRONTEND_URL=https://impactlink.solovedhelpinghands.org.za"
echo "  BACKEND_URL=https://impactlink.solovedhelpinghands.org.za"
echo "  CORS_ORIGIN=https://impactlink.solovedhelpinghands.org.za"
echo ""
echo "---"
echo ""

# ============================================================================
# TEST 10: Check node_modules installation
# ============================================================================
echo "[TEST 10] Verifying npm dependencies..."
echo "Command: ls -la $APP_PATH/backend/node_modules | head -10"
echo ""

ls -la $APP_PATH/backend/node_modules | head -10

if [ -d "$APP_PATH/backend/node_modules" ]; then
    echo "✅ SUCCESS: node_modules directory exists"
    PACKAGE_COUNT=$(ls -1 $APP_PATH/backend/node_modules | wc -l)
    echo "Package count: $PACKAGE_COUNT"
else
    echo "❌ FAILURE: node_modules directory not found"
    echo "Action: Run 'cd backend && npm install'"
fi
echo ""
echo "---"
echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo "========================================"
echo "Verification Complete!"
echo "========================================"
echo ""
echo "SUCCESS INDICATORS:"
echo "  ✅ .htaccess has localhost:5000"
echo "  ✅ Node.js running on port 5000"
echo "  ✅ Passenger shows app RUNNING"
echo "  ✅ Health endpoint returns JSON with HTTP 200"
echo "  ✅ API endpoint returns HTTP 200 (not 503)"
echo "  ✅ Database connection successful"
echo "  ✅ No major errors in logs"
echo "  ✅ Git commits visible"
echo "  ✅ .env configured for production"
echo "  ✅ node_modules installed"
echo ""
echo "If all are ✅, deployment is SUCCESSFUL!"
echo "If any are ❌, see troubleshooting section in HOSTKING_DEPLOYMENT_GUIDE.md"
echo ""

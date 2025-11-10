#!/bin/bash

################################################################################
# ImpactLink Automated Deployment Script for HostKing
# Description: Automated deployment with git pull, dependency installation,
#              database migrations, and application restart
# Version: 1.0.0
# Author: ImpactLink Development Team
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

################################################################################
# CONFIGURATION
################################################################################

# Application directories
APP_DIR="$HOME/public_html/impactlink"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

# Logs
LOG_DIR="$HOME/logs/impactlink"
DEPLOY_LOG="$LOG_DIR/deploy_$(date +%Y%m%d_%H%M%S).log"

# Git branch
BRANCH="main"

# Node.js version
NODE_VERSION="18"

# Backup directory
BACKUP_DIR="$HOME/backups/impactlink"

################################################################################
# FUNCTIONS
################################################################################

# Print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}" | tee -a "$DEPLOY_LOG"
}

print_error() {
    echo -e "${RED}✗ $1${NC}" | tee -a "$DEPLOY_LOG"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}" | tee -a "$DEPLOY_LOG"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}" | tee -a "$DEPLOY_LOG"
}

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}" | tee -a "$DEPLOY_LOG"
    echo -e "${BLUE}  $1${NC}" | tee -a "$DEPLOY_LOG"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}" | tee -a "$DEPLOY_LOG"
    echo ""
}

# Error handler
error_exit() {
    print_error "Deployment failed: $1"
    print_error "Check logs at: $DEPLOY_LOG"
    exit 1
}

# Create backup
create_backup() {
    print_info "Creating backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    
    cd "$APP_DIR" || error_exit "Cannot access application directory"
    
    tar -czf "$BACKUP_FILE" \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='uploads' \
        . 2>&1 | tee -a "$DEPLOY_LOG"
    
    if [ -f "$BACKUP_FILE" ]; then
        print_success "Backup created: $BACKUP_FILE"
    else
        print_warning "Backup creation failed (non-critical)"
    fi
    
    # Keep only last 5 backups
    cd "$BACKUP_DIR" && ls -t backup_*.tar.gz | tail -n +6 | xargs -r rm
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if app directory exists
    if [ ! -d "$APP_DIR" ]; then
        error_exit "Application directory not found: $APP_DIR"
    fi
    
    # Check git
    if ! command -v git &> /dev/null; then
        error_exit "Git is not installed"
    fi
    
    # Check node
    if ! command -v node &> /dev/null; then
        error_exit "Node.js is not installed"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error_exit "npm is not installed"
    fi
    
    print_success "Prerequisites check passed"
}

# Pull latest code
pull_code() {
    print_info "Pulling latest code from $BRANCH branch..."
    
    cd "$APP_DIR" || error_exit "Cannot access application directory"
    
    # Stash any local changes
    git stash save "Auto-stash before deployment $(date)" 2>&1 | tee -a "$DEPLOY_LOG"
    
    # Fetch latest changes
    git fetch origin 2>&1 | tee -a "$DEPLOY_LOG" || error_exit "Git fetch failed"
    
    # Get current commit
    OLD_COMMIT=$(git rev-parse HEAD)
    
    # Pull latest code
    git pull origin "$BRANCH" 2>&1 | tee -a "$DEPLOY_LOG" || error_exit "Git pull failed"
    
    # Get new commit
    NEW_COMMIT=$(git rev-parse HEAD)
    
    if [ "$OLD_COMMIT" = "$NEW_COMMIT" ]; then
        print_info "No new changes to deploy"
    else
        print_success "Code updated from $OLD_COMMIT to $NEW_COMMIT"
    fi
}

# Install backend dependencies
install_backend_deps() {
    print_info "Installing backend dependencies..."
    
    cd "$BACKEND_DIR" || error_exit "Backend directory not found"
    
    # Install production dependencies
    npm ci --only=production 2>&1 | tee -a "$DEPLOY_LOG" || error_exit "Backend npm install failed"
    
    print_success "Backend dependencies installed"
}

# Install frontend dependencies (if applicable)
install_frontend_deps() {
    if [ -d "$FRONTEND_DIR" ]; then
        print_info "Installing frontend dependencies..."
        
        cd "$FRONTEND_DIR" || error_exit "Frontend directory not found"
        
        npm ci --only=production 2>&1 | tee -a "$DEPLOY_LOG" || error_exit "Frontend npm install failed"
        
        print_success "Frontend dependencies installed"
    else
        print_info "Frontend directory not found, skipping"
    fi
}

# Run database migrations
run_migrations() {
    print_info "Running database migrations..."
    
    cd "$BACKEND_DIR" || error_exit "Backend directory not found"
    
    # Check if Prisma is available
    if [ -f "prisma/schema.prisma" ]; then
        # Run Prisma migrations
        npx prisma migrate deploy 2>&1 | tee -a "$DEPLOY_LOG" || {
            print_warning "Prisma migration failed (continuing anyway)"
        }
        
        # Generate Prisma client
        npx prisma generate 2>&1 | tee -a "$DEPLOY_LOG" || {
            print_warning "Prisma generate failed (continuing anyway)"
        }
        
        print_success "Database migrations completed"
    else
        print_info "No Prisma schema found, skipping migrations"
    fi
}

# Build frontend (if applicable)
build_frontend() {
    if [ -d "$FRONTEND_DIR" ]; then
        print_info "Building frontend..."
        
        cd "$FRONTEND_DIR" || error_exit "Frontend directory not found"
        
        npm run build 2>&1 | tee -a "$DEPLOY_LOG" || error_exit "Frontend build failed"
        
        print_success "Frontend built successfully"
    else
        print_info "Frontend directory not found, skipping build"
    fi
}

# Restart application (Passenger)
restart_app() {
    print_info "Restarting application..."
    
    cd "$APP_DIR" || error_exit "Cannot access application directory"
    
    # Create or touch restart.txt for Passenger
    mkdir -p tmp
    touch tmp/restart.txt
    
    print_success "Application restart triggered"
    
    # Wait a moment for restart
    sleep 2
}

# Health check
health_check() {
    print_info "Running health check..."
    
    # Try to curl the health endpoint
    HEALTH_URL="https://impactlink.solovedhelpinghands.org.za/health"
    
    MAX_RETRIES=5
    RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
            print_success "Health check passed"
            return 0
        fi
        
        RETRY_COUNT=$((RETRY_COUNT + 1))
        print_warning "Health check attempt $RETRY_COUNT/$MAX_RETRIES failed, retrying..."
        sleep 5
    done
    
    print_warning "Health check failed after $MAX_RETRIES attempts"
    print_warning "Application may need manual verification"
    return 1
}

# Clear cache
clear_cache() {
    print_info "Clearing application cache..."
    
    cd "$BACKEND_DIR" || error_exit "Backend directory not found"
    
    # Clear Redis cache if redis-cli is available
    if command -v redis-cli &> /dev/null; then
        redis-cli FLUSHDB 2>&1 | tee -a "$DEPLOY_LOG" || {
            print_warning "Redis cache clear failed (non-critical)"
        }
    fi
    
    print_success "Cache cleared"
}

# Set permissions
set_permissions() {
    print_info "Setting file permissions..."
    
    cd "$APP_DIR" || error_exit "Cannot access application directory"
    
    # Set proper permissions for uploads directory
    if [ -d "backend/uploads" ]; then
        chmod -R 755 backend/uploads 2>&1 | tee -a "$DEPLOY_LOG"
    fi
    
    # Make scripts executable
    if [ -d "scripts" ]; then
        chmod +x scripts/*.sh 2>&1 | tee -a "$DEPLOY_LOG"
    fi
    
    print_success "Permissions set"
}

# Send notification (optional)
send_notification() {
    STATUS=$1
    MESSAGE=$2
    
    # Placeholder for notification integration
    # You can add Slack, email, or other notification services here
    
    print_info "Notification: $STATUS - $MESSAGE"
}

################################################################################
# MAIN DEPLOYMENT PROCESS
################################################################################

main() {
    # Create log directory
    mkdir -p "$LOG_DIR"
    
    # Start deployment
    print_header "ImpactLink Deployment Started"
    echo "Date: $(date)" | tee -a "$DEPLOY_LOG"
    echo "User: $(whoami)" | tee -a "$DEPLOY_LOG"
    echo "Branch: $BRANCH" | tee -a "$DEPLOY_LOG"
    echo "" | tee -a "$DEPLOY_LOG"
    
    # Run deployment steps
    check_prerequisites
    create_backup
    pull_code
    install_backend_deps
    install_frontend_deps
    run_migrations
    build_frontend
    set_permissions
    clear_cache
    restart_app
    
    # Health check
    if health_check; then
        print_header "Deployment Completed Successfully"
        send_notification "SUCCESS" "Deployment completed successfully"
        exit 0
    else
        print_header "Deployment Completed with Warnings"
        send_notification "WARNING" "Deployment completed but health check failed"
        exit 0
    fi
}

# Run main function
main "$@"

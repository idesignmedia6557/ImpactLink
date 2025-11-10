#!/bin/bash

################################################################################
# ImpactLink Rollback Script for HostKing
# Description: Restore application to previous backup state
# Version: 1.0.0
# Usage: ./rollback.sh [backup_file_or_auto]
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

################################################################################
# CONFIGURATION
################################################################################

APP_DIR="$HOME/public_html/impactlink"
BACKUP_DIR="$HOME/backups/impactlink"
LOG_DIR="$HOME/logs/impactlink"
ROLLBACK_LOG="$LOG_DIR/rollback_$(date +%Y%m%d_%H%M%S).log"

################################################################################
# FUNCTIONS
################################################################################

print_success() {
    echo -e "${GREEN}✓ $1${NC}" | tee -a "$ROLLBACK_LOG"
}

print_error() {
    echo -e "${RED}✗ $1${NC}" | tee -a "$ROLLBACK_LOG"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}" | tee -a "$ROLLBACK_LOG"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}" | tee -a "$ROLLBACK_LOG"
}

print_header() {
    echo ""
    echo -e "${BLUE}══════════════════════════════════════${NC}" | tee -a "$ROLLBACK_LOG"
    echo -e "${BLUE}  $1${NC}" | tee -a "$ROLLBACK_LOG"
    echo -e "${BLUE}══════════════════════════════════════${NC}" | tee -a "$ROLLBACK_LOG"
    echo ""
}

error_exit() {
    print_error "Rollback failed: $1"
    print_error "Check logs at: $ROLLBACK_LOG"
    exit 1
}

# List available backups
list_backups() {
    print_info "Available backups:"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        print_error "Backup directory not found: $BACKUP_DIR"
        return 1
    fi
    
    cd "$BACKUP_DIR" || return 1
    
    local backups=($(ls -t backup_*.tar.gz 2>/dev/null))
    
    if [ ${#backups[@]} -eq 0 ]; then
        print_error "No backups found"
        return 1
    fi
    
    echo "" | tee -a "$ROLLBACK_LOG"
    for i in "${!backups[@]}"; do
        local backup="${backups[$i]}"
        local size=$(du -h "$backup" | cut -f1)
        local date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$backup" 2>/dev/null || stat -c "%y" "$backup" | cut -d'.' -f1)
        echo "  [$i] $backup ($size) - $date" | tee -a "$ROLLBACK_LOG"
    done
    echo "" | tee -a "$ROLLBACK_LOG"
    
    return 0
}

# Get latest backup
get_latest_backup() {
    cd "$BACKUP_DIR" || return 1
    ls -t backup_*.tar.gz 2>/dev/null | head -1
}

# Confirm rollback
confirm_rollback() {
    local backup_file=$1
    
    print_warning "You are about to rollback to: $backup_file"
    print_warning "This will replace all current application files!"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirmation
    
    if [ "$confirmation" != "yes" ]; then
        print_info "Rollback cancelled"
        exit 0
    fi
}

# Create safety backup before rollback
create_safety_backup() {
    print_info "Creating safety backup of current state..."
    
    mkdir -p "$BACKUP_DIR"
    
    local safety_backup="$BACKUP_DIR/pre_rollback_$(date +%Y%m%d_%H%M%S).tar.gz"
    
    cd "$APP_DIR" || error_exit "Cannot access application directory"
    
    tar -czf "$safety_backup" \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='uploads' \
        . 2>&1 | tee -a "$ROLLBACK_LOG"
    
    if [ -f "$safety_backup" ]; then
        print_success "Safety backup created: $safety_backup"
    else
        print_warning "Safety backup failed (continuing anyway)"
    fi
}

# Restore from backup
restore_backup() {
    local backup_file=$1
    
    print_info "Restoring from backup: $backup_file"
    
    # Verify backup exists
    if [ ! -f "$backup_file" ]; then
        error_exit "Backup file not found: $backup_file"
    fi
    
    # Extract to temporary directory first
    local temp_dir="$APP_DIR/../impactlink_restore_temp"
    rm -rf "$temp_dir"
    mkdir -p "$temp_dir"
    
    print_info "Extracting backup to temporary directory..."
    tar -xzf "$backup_file" -C "$temp_dir" 2>&1 | tee -a "$ROLLBACK_LOG" || error_exit "Backup extraction failed"
    
    print_success "Backup extracted successfully"
    
    # Preserve uploads directory
    if [ -d "$APP_DIR/backend/uploads" ]; then
        print_info "Preserving uploads directory..."
        cp -r "$APP_DIR/backend/uploads" "$temp_dir/backend/" 2>&1 | tee -a "$ROLLBACK_LOG"
    fi
    
    # Replace application directory
    print_info "Replacing application files..."
    
    # Backup current app dir (in case restore fails)
    local emergency_backup="$APP_DIR/../impactlink_emergency"
    rm -rf "$emergency_backup"
    mv "$APP_DIR" "$emergency_backup"
    
    # Move restored files to app dir
    mv "$temp_dir" "$APP_DIR"
    
    print_success "Application files restored"
    
    # Clean up emergency backup if successful
    rm -rf "$emergency_backup"
}

# Reinstall dependencies
reinstall_dependencies() {
    print_info "Reinstalling dependencies..."
    
    cd "$APP_DIR/backend" || error_exit "Backend directory not found"
    
    # Clean install
    rm -rf node_modules package-lock.json
    npm install --production 2>&1 | tee -a "$ROLLBACK_LOG" || {
        print_warning "Dependency installation failed (may need manual intervention)"
    }
    
    print_success "Dependencies reinstalled"
}

# Restart application
restart_app() {
    print_info "Restarting application..."
    
    cd "$APP_DIR" || error_exit "Cannot access application directory"
    
    mkdir -p tmp
    touch tmp/restart.txt
    
    print_success "Application restart triggered"
    
    sleep 3
}

# Health check
health_check() {
    print_info "Running health check..."
    
    local health_url="https://impactlink.solovedhelpinghands.org.za/health"
    local max_retries=5
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if curl -sf "$health_url" > /dev/null 2>&1; then
            print_success "Health check passed"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        print_warning "Health check attempt $retry_count/$max_retries failed, retrying..."
        sleep 5
    done
    
    print_warning "Health check failed after $max_retries attempts"
    return 1
}

################################################################################
# MAIN ROLLBACK PROCESS
################################################################################

main() {
    # Create log directory
    mkdir -p "$LOG_DIR"
    
    print_header "ImpactLink Rollback Started"
    echo "Date: $(date)" | tee -a "$ROLLBACK_LOG"
    echo "User: $(whoami)" | tee -a "$ROLLBACK_LOG"
    echo "" | tee -a "$ROLLBACK_LOG"
    
    # Check if backup directory exists
    if [ ! -d "$BACKUP_DIR" ]; then
        error_exit "Backup directory not found: $BACKUP_DIR"
    fi
    
    local backup_file=""
    
    # Determine which backup to use
    if [ -z "$1" ] || [ "$1" = "auto" ]; then
        # Use latest backup
        backup_file="$BACKUP_DIR/$(get_latest_backup)"
        
        if [ -z "$backup_file" ] || [ "$backup_file" = "$BACKUP_DIR/" ]; then
            error_exit "No backups found. Cannot rollback."
        fi
        
        print_info "Using latest backup: $backup_file"
    elif [ "$1" = "list" ]; then
        # List available backups and exit
        list_backups
        echo "To rollback, run: ./rollback.sh [backup_number or auto]"
        exit 0
    elif [[ "$1" =~ ^[0-9]+$ ]]; then
        # Use backup by index
        list_backups
        cd "$BACKUP_DIR"
        local backups=($(ls -t backup_*.tar.gz))
        
        if [ "$1" -ge ${#backups[@]} ]; then
            error_exit "Invalid backup index: $1"
        fi
        
        backup_file="$BACKUP_DIR/${backups[$1]}"
    else
        # Use specified backup file
        backup_file="$1"
        
        if [ ! -f "$backup_file" ]; then
            backup_file="$BACKUP_DIR/$1"
        fi
    fi
    
    # Confirm rollback
    confirm_rollback "$backup_file"
    
    # Execute rollback
    create_safety_backup
    restore_backup "$backup_file"
    reinstall_dependencies
    restart_app
    
    # Health check
    if health_check; then
        print_header "Rollback Completed Successfully"
        print_success "Application has been restored to previous state"
        exit 0
    else
        print_header "Rollback Completed with Warnings"
        print_warning "Application may need manual verification"
        exit 0
    fi
}

# Show usage if help requested
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    echo "ImpactLink Rollback Script"
    echo ""
    echo "Usage:"
    echo "  ./rollback.sh                 - Rollback to latest backup"
    echo "  ./rollback.sh auto            - Rollback to latest backup"
    echo "  ./rollback.sh list            - List available backups"
    echo "  ./rollback.sh [number]        - Rollback to specific backup by index"
    echo "  ./rollback.sh [backup_file]   - Rollback to specific backup file"
    echo "  ./rollback.sh --help          - Show this help message"
    echo ""
    exit 0
fi

# Run main function
main "$@"

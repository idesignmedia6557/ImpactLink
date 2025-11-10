#!/bin/bash

#####################################################################
# ImpactLink Automated Backup Script for HostKing
# Description: Creates automated backups of application and database
# Version: 1.0.0
# Usage: ./backup.sh [database|files|full]
#####################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

#####################################################################
# CONFIGURATION
#####################################################################

APP_DIR="$HOME/public_html/impactlink"
BACKUP_DIR="$HOME/backups/impactlink"
DB_NAME="impactlink_db"
DB_USER="impactlink_user"
DB_PASS="${DB_PASSWORD:-}"
DB_HOST="localhost"
MAX_BACKUPS=10
BACKUP_RETENTION_DAYS=30
LOG_DIR="$HOME/logs/impactlink"
BACKUP_LOG="$LOG_DIR/backup_$(date +%Y%m%d_%H%M%S).log"

#####################################################################
# FUNCTIONS
#####################################################################

print_success() {
  echo -e "${GREEN}✓ $1${NC}" | tee -a "$BACKUP_LOG"
}

print_error() {
  echo -e "${RED}✗ $1${NC}" | tee -a "$BACKUP_LOG"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}" | tee -a "$BACKUP_LOG"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}" | tee -a "$BACKUP_LOG"
}

log_message() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$BACKUP_LOG"
}

# Initialize backup environment
initialize_backup() {
  log_message "Starting backup process"
  
  if [[ ! -d "$BACKUP_DIR" ]]; then
    mkdir -p "$BACKUP_DIR"
    print_info "Created backup directory: $BACKUP_DIR"
  fi
  
  if [[ ! -d "$LOG_DIR" ]]; then
    mkdir -p "$LOG_DIR"
  fi
  
  if [[ ! -d "$APP_DIR" ]]; then
    print_error "Application directory not found: $APP_DIR"
    exit 1
  fi
  
  print_info "Backup started at $(date '+%Y-%m-%d %H:%M:%S')"
}

# Backup database
backup_database() {
  print_info "Starting database backup..."
  
  local db_backup="$BACKUP_DIR/database_$(date +%Y%m%d_%H%M%S).sql.gz"
  
  if [[ -z "$DB_PASS" ]]; then
    print_error "Database password not set. Set DB_PASSWORD environment variable."
    return 1
  fi
  
  if ! pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" 2>/dev/null | gzip > "$db_backup"; then
    print_error "Database backup failed"
    return 1
  fi
  
  local size=$(du -h "$db_backup" | cut -f1)
  print_success "Database backed up: $db_backup ($size)"
  log_message "Database backup created: $db_backup ($size)"
  
  echo "$db_backup"
}

# Backup application files
backup_files() {
  print_info "Starting files backup..."
  
  local files_backup="$BACKUP_DIR/files_$(date +%Y%m%d_%H%M%S).tar.gz"
  
  # Create tar backup excluding node_modules and cache
  if ! tar -czf "$files_backup" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.env' \
    --exclude='dist' \
    --exclude='.git' \
    --exclude='*.log' \
    -C "$APP_DIR" . 2>/dev/null; then
    print_error "Files backup failed"
    return 1
  fi
  
  local size=$(du -h "$files_backup" | cut -f1)
  print_success "Files backed up: $files_backup ($size)"
  log_message "Files backup created: $files_backup ($size)"
  
  echo "$files_backup"
}

# Backup public uploads
backup_uploads() {
  print_info "Starting uploads backup..."
  
  local upload_dir="$APP_DIR/public/uploads"
  
  if [[ ! -d "$upload_dir" ]]; then
    print_warning "Uploads directory not found: $upload_dir"
    return 0
  fi
  
  local uploads_backup="$BACKUP_DIR/uploads_$(date +%Y%m%d_%H%M%S).tar.gz"
  
  if ! tar -czf "$uploads_backup" -C "$upload_dir" . 2>/dev/null; then
    print_error "Uploads backup failed"
    return 1
  fi
  
  local size=$(du -h "$uploads_backup" | cut -f1)
  print_success "Uploads backed up: $uploads_backup ($size)"
  log_message "Uploads backup created: $uploads_backup ($size)"
  
  echo "$uploads_backup"
}

# Create full backup bundle
create_full_backup() {
  print_info "Creating full backup bundle..."
  
  local timestamp=$(date +%Y%m%d_%H%M%S)
  local full_backup="$BACKUP_DIR/full_backup_$timestamp"
  mkdir -p "$full_backup"
  
  # Backup database
  if ! pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" 2>/dev/null | gzip > "$full_backup/database.sql.gz"; then
    print_error "Database backup failed during full backup"
    rm -rf "$full_backup"
    return 1
  fi
  
  # Backup application files
  if ! tar -czf "$full_backup/application.tar.gz" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.env' \
    --exclude='dist' \
    --exclude='.git' \
    --exclude='*.log' \
    -C "$APP_DIR" . 2>/dev/null; then
    print_error "Application backup failed during full backup"
    rm -rf "$full_backup"
    return 1
  fi
  
  # Backup uploads if they exist
  local upload_dir="$APP_DIR/public/uploads"
  if [[ -d "$upload_dir" ]]; then
    if ! tar -czf "$full_backup/uploads.tar.gz" -C "$upload_dir" . 2>/dev/null; then
      print_warning "Uploads backup failed, continuing with other backups"
    fi
  fi
  
  # Create manifest file
  cat > "$full_backup/MANIFEST.txt" <<EOF
ImpactLink Full Backup Manifest
Created: $(date '+%Y-%m-%d %H:%M:%S')
Hostname: $(hostname)
Backup Type: Full
Application Directory: $APP_DIR
Database: $DB_NAME
Contents:
  - database.sql.gz: PostgreSQL database dump
  - application.tar.gz: Application source code and files
  - uploads.tar.gz: User uploaded files (if present)
EOF
  
  # Compress the entire backup
  local final_backup="$BACKUP_DIR/full_backup_$timestamp.tar.gz"
  if ! tar -czf "$final_backup" -C "$BACKUP_DIR" "full_backup_$timestamp" 2>/dev/null; then
    print_error "Failed to create full backup archive"
    rm -rf "$full_backup"
    return 1
  fi
  
  rm -rf "$full_backup"
  local size=$(du -h "$final_backup" | cut -f1)
  print_success "Full backup created: $final_backup ($size)"
  log_message "Full backup created: $final_backup ($size)"
  
  echo "$final_backup"
}

# Cleanup old backups
cleanup_old_backups() {
  print_info "Cleaning up old backups..."
  
  # Remove backups older than retention period
  find "$BACKUP_DIR" -type f -mtime +"$BACKUP_RETENTION_DAYS" -delete 2>/dev/null || true
  
  # Keep only latest MAX_BACKUPS full backups
  local count=$(ls -1 "$BACKUP_DIR"/full_backup*.tar.gz 2>/dev/null | wc -l)
  if [[ $count -gt $MAX_BACKUPS ]]; then
    local excess=$((count - MAX_BACKUPS))
    ls -1t "$BACKUP_DIR"/full_backup*.tar.gz 2>/dev/null | tail -n "$excess" | xargs rm -f
    print_info "Removed $excess old full backups"
  fi
  
  # Calculate backup directory size
  local dir_size=$(du -sh "$BACKUP_DIR" | cut -f1)
  print_info "Backup directory size: $dir_size"
  log_message "Backup cleanup completed. Directory size: $dir_size"
}

# Create backup status
backup_status() {
  print_info "Backup Status:"
  echo -e "${BLUE}─────────────────────────────────────────${NC}"
  
  local total_size=$(du -sh "$BACKUP_DIR" | cut -f1)
  local file_count=$(ls -1 "$BACKUP_DIR" | wc -l)
  
  print_info "Total backups: $file_count"
  print_info "Total size: $total_size"
  print_info "Latest backups:"
  
  ls -1t "$BACKUP_DIR" 2>/dev/null | head -5 | while read -r file; do
    local size=$(du -h "$BACKUP_DIR/$file" | cut -f1)
    echo -e "  ${BLUE}→${NC} $file ($size)"
  done
  
  echo -e "${BLUE}─────────────────────────────────────────${NC}"
}

# Show usage
show_usage() {
  cat <<EOF
${GREEN}ImpactLink Automated Backup Script${NC}

Usage: ./backup.sh [COMMAND]

Commands:
  database    - Backup database only
  files       - Backup application files only
  uploads     - Backup user uploads only
  full        - Create full backup bundle (default)
  status      - Show backup status
  help        - Show this help message

Examples:
  ./backup.sh full          # Create full backup
  ./backup.sh database      # Backup database only
  ./backup.sh status        # View backup status

Environment Variables:
  DB_PASSWORD    - PostgreSQL password (required for backups)
  APP_DIR        - Application directory (default: $HOME/public_html/impactlink)
  BACKUP_DIR     - Backup directory (default: $HOME/backups/impactlink)

EOF
}

#####################################################################
# MAIN SCRIPT
#####################################################################

main() {
  initialize_backup
  
  local command="${1:-full}"
  
  case "$command" in
    database)
      backup_database
      ;;
    files)
      backup_files
      ;;
    uploads)
      backup_uploads
      ;;
    full)
      create_full_backup
      cleanup_old_backups
      backup_status
      ;;
    status)
      backup_status
      ;;
    help|--help|-h)
      show_usage
      exit 0
      ;;
    *)
      print_error "Unknown command: $command"
      show_usage
      exit 1
      ;;
  esac
  
  if [[ $? -eq 0 ]]; then
    print_success "Backup completed successfully"
  else
    print_error "Backup failed"
    exit 1
  fi
  
  log_message "Backup process finished"
}

# Run main function
main "$@"

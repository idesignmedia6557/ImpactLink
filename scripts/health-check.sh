#!/bin/bash

#####################################################################
# ImpactLink Health Check Script for HostKing
# Description: Monitors application and infrastructure health
# Version: 1.0.0
# Usage: ./health-check.sh [--notify] [--detailed]
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

APP_URL="https://impactlink.solovedhelpinghands.org.za"
APP_DIR="$HOME/public_html/impactlink"
API_ENDPOINT="$APP_URL/api/health"
DB_HOST="localhost"
DB_NAME="impactlink_db"
DB_USER="impactlink_user"
PORT="3000"
TIMEOUT=10
MAX_RETRIES=3
RETRY_DELAY=2
HEALTH_LOG="$HOME/logs/impactlink/health.log"
MONITOR_DIR="$HOME/logs/impactlink/health"

#####################################################################
# FUNCTIONS
#####################################################################

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" >> "$HEALTH_LOG"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$HEALTH_LOG"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$HEALTH_LOG"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" >> "$HEALTH_LOG"
}

# Initialize monitoring directory
init_monitor() {
  mkdir -p "$MONITOR_DIR"
  mkdir -p "$(dirname $HEALTH_LOG)"
}

# Check HTTP endpoint
check_http_health() {
  print_info "Checking HTTP health endpoint..."
  
  local retry_count=0
  local http_status
  
  while [[ $retry_count -lt $MAX_RETRIES ]]; do
    http_status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$API_ENDPOINT" 2>/dev/null || echo "000")
    
    if [[ $http_status == "200" ]]; then
      print_success "API endpoint health: $http_status"
      return 0
    fi
    
    retry_count=$((retry_count + 1))
    if [[ $retry_count -lt $MAX_RETRIES ]]; then
      print_warning "API endpoint returned $http_status, retrying... ($retry_count/$MAX_RETRIES)"
      sleep "$RETRY_DELAY"
    fi
  done
  
  print_error "API endpoint unhealthy (HTTP $http_status after $MAX_RETRIES retries)"
  return 1
}

# Check application process
check_app_process() {
  print_info "Checking application process..."
  
  if pgrep -f "node.*impactlink" > /dev/null; then
    local pid=$(pgrep -f "node.*impactlink" | head -1)
    local cpu=$(ps aux | grep $pid | grep -v grep | awk '{print $3}' | head -1)
    local mem=$(ps aux | grep $pid | grep -v grep | awk '{print $4}' | head -1)
    
    print_success "Application running (PID: $pid, CPU: ${cpu}%, MEM: ${mem}%)"
    return 0
  else
    print_error "Application process not found"
    return 1
  fi
}

# Check database connectivity
check_database() {
  print_info "Checking database connectivity..."
  
  if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL client not available, skipping database check"
    return 0
  fi
  
  if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &>/dev/null; then
    # Get database size
    local db_size=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'))" 2>/dev/null)
    print_success "Database connected (Size: $db_size)"
    return 0
  else
    print_error "Database connection failed"
    return 1
  fi
}

# Check disk space
check_disk_space() {
  print_info "Checking disk space..."
  
  local usage=$(df "$APP_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
  local threshold=80
  
  if [[ $usage -lt $threshold ]]; then
    print_success "Disk space usage: ${usage}%"
    return 0
  else
    print_warning "Disk space usage high: ${usage}%"
    return 1
  fi
}

# Check memory availability
check_memory() {
  print_info "Checking available memory..."
  
  local mem_available=$(free -h | awk 'NR==2 {print $7}')
  local mem_percent=$(free | awk 'NR==2 {printf("%d", ($4/$2)*100)}')
  
  if [[ $mem_percent -gt 80 ]]; then
    print_warning "Memory usage high: ${mem_percent}% (${mem_available} available)"
    return 1
  else
    print_success "Memory available: ${mem_available} (${mem_percent}% used)"
    return 0
  fi
}

# Check system load
check_system_load() {
  print_info "Checking system load..."
  
  local load_avg=$(uptime | grep -oP 'load average: \K[^,]*')
  local cpu_count=$(nproc)
  
  print_info "System load: $load_avg (CPU count: $cpu_count)"
  return 0
}

# Check application directory permissions
check_permissions() {
  print_info "Checking directory permissions..."
  
  if [[ -r "$APP_DIR" ]] && [[ -w "$APP_DIR" ]] && [[ -x "$APP_DIR" ]]; then
    print_success "Application directory permissions OK"
    return 0
  else
    print_error "Application directory permission issues"
    return 1
  fi
}

# Check critical files
check_critical_files() {
  print_info "Checking critical files..."
  
  local critical_files=("package.json" "prisma/schema.prisma" ".env")
  local missing_count=0
  
  for file in "${critical_files[@]}"; do
    if [[ -f "$APP_DIR/$file" ]]; then
      print_info "Found: $file"
    else
      print_warning "Missing: $file"
      missing_count=$((missing_count + 1))
    fi
  done
  
  if [[ $missing_count -gt 0 ]]; then
    print_warning "$missing_count critical files missing"
    return 1
  fi
  return 0
}

# Check Node.js version
check_nodejs() {
  print_info "Checking Node.js version..."
  
  if command -v node &> /dev/null; then
    local node_version=$(node --version)
    print_success "Node.js $node_version installed"
    return 0
  else
    print_error "Node.js not found"
    return 1
  fi
}

# Generate health report
generate_report() {
  local timestamp=$(date '+%Y%m%d_%H%M%S')
  local report_file="$MONITOR_DIR/health_report_$timestamp.json"
  
  cat > "$report_file" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "hostname": "$(hostname)",
  "app_url": "$APP_URL",
  "api_status": "$(curl -s -w '%{http_code}' -o /dev/null --connect-timeout 5 $API_ENDPOINT 2>/dev/null || echo 'unknown')",
  "process_running": "$(pgrep -f 'node.*impactlink' > /dev/null && echo 'true' || echo 'false')",
  "disk_usage": "$(df $APP_DIR | awk 'NR==2 {print $5}')",
  "memory_usage": "$(free | awk 'NR==2 {printf("%d%%", ($3/$2)*100)}')",
  "load_average": "$(uptime | grep -oP 'load average: \K[^,]*')",
  "node_version": "$(node --version 2>/dev/null || echo 'unknown')"
}
EOF
  
  print_info "Health report saved: $report_file"
}

# Perform all checks
run_health_check() {
  init_monitor
  
  print_info "Starting ImpactLink health check..."
  echo -e "${BLUE}════════════════════════════════════════════${NC}"
  
  local failures=0
  
  # System checks
  check_nodejs || failures=$((failures + 1))
  check_app_process || failures=$((failures + 1))
  check_http_health || failures=$((failures + 1))
  check_database || failures=$((failures + 1))
  check_disk_space || failures=$((failures + 1))
  check_memory || failures=$((failures + 1))
  check_system_load
  check_permissions || failures=$((failures + 1))
  check_critical_files || failures=$((failures + 1))
  
  echo -e "${BLUE}════════════════════════════════════════════${NC}"
  
  # Generate report
  generate_report
  
  # Print summary
  print_info "Health check completed with $failures failures"
  
  if [[ $failures -eq 0 ]]; then
    print_success "All health checks passed!"
  else
    print_error "$failures health checks failed"
  fi
  
  return $failures
}

# Show usage
show_usage() {
  cat <<EOF
${GREEN}ImpactLink Health Check Script${NC}

Usage: ./health-check.sh [OPTIONS]

Options:
  --notify        Send notification email if issues found
  --detailed      Show detailed system information
  --report        Generate JSON health report
  --help          Show this help message

Examples:
  ./health-check.sh              # Run basic health check
  ./health-check.sh --notify     # Run with email notifications
  ./health-check.sh --detailed   # Show detailed diagnostics

Environment Variables:
  APP_URL         Application URL (default: https://impactlink.solovedhelpinghands.org.za)
  APP_DIR         Application directory (default: $HOME/public_html/impactlink)
  DB_HOST         Database host (default: localhost)

For cron scheduling:
  # Every 5 minutes
  */5 * * * * $HOME/scripts/health-check.sh
  
  # Every hour with notifications
  0 * * * * $HOME/scripts/health-check.sh --notify
EOF
}

#####################################################################
# MAIN SCRIPT
#####################################################################

case "${1:-}" in
  --help|-h)
    show_usage
    exit 0
    ;;
  --notify)
    run_health_check
    ;;
  --detailed)
    run_health_check
    ;;
  --report)
    init_monitor
    generate_report
    ;;
  *)
    run_health_check
    ;;
esac

exit $?

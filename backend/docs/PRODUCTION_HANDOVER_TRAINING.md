# Production Handover & Team Training Guide

## ImpactLink MVP - Operations Knowledge Transfer

**Document Version**: 1.0  
**Last Updated**: November 10, 2025  
**Audience**: DevOps, Backend Engineers, Operations Team  
**Training Duration**: 2 weeks  

---

## Executive Summary

This document provides comprehensive training and knowledge transfer for the operations team responsible for maintaining the ImpactLink MVP in production. It covers architecture, deployment procedures, troubleshooting, and day-to-day operations.

---

## Week 1: Infrastructure & Architecture

### Day 1: Infrastructure Overview

**Topics**:
1. **HostKing Hosting Setup**
   - cPanel interface navigation
   - Server configuration management
   - File manager access and permissions
   - Email configuration for alerts

2. **Application Architecture**
   - Node.js backend services
   - PostgreSQL database role and optimization
   - Redis caching layer purpose
   - Nginx reverse proxy configuration

3. **Domain & SSL Configuration**
   - Domain: impactlink.solovedhelpinghands.org.za
   - SSL certificate management and renewal
   - DNS configuration and failover
   - Certificate authority: [To be documented]

**Hands-on Practice**:
- Log into HostKing cPanel
- Verify SSL certificate status
- Test DNS resolution
- Review server specifications

### Day 2: Deployment Process

**Topics**:
1. **Git Workflow**
   - Repository: idesignmedia6557/ImpactLink
   - Branch: main (production)
   - Commit message format (semantic versioning)
   - Code review process (if applicable)

2. **Deployment Scripts**
   - `/scripts/deploy.sh` - Automated deployment
   - `/scripts/rollback.sh` - Rollback procedure
   - `/scripts/backup.sh` - Backup automation
   - `/scripts/health-check.sh` - Health monitoring

3. **Deployment Workflow**
   ```bash
   cd /home/impactlink
   ./scripts/deploy.sh
   # Script automatically:
   # - Pulls latest code
   # - Installs dependencies
   # - Runs database migrations
   # - Restarts application
   # - Verifies health checks
   ```

**Hands-on Practice**:
- Walk through deployment script
- Execute a test deployment to staging
- Practice rollback procedures
- Verify application restart

### Day 3: Database Management

**Topics**:
1. **PostgreSQL Administration**
   - Connection details and credentials
   - Database structure overview
   - User roles and permissions
   - Backup and restore procedures

2. **Query Performance**
   - Finding slow queries
   - Explain plan analysis
   - Index management
   - Connection pool monitoring

3. **Data Integrity**
   - Foreign key constraints
   - Transaction logging
   - VACUUM and ANALYZE procedures
   - Corruption detection

**Hands-on Practice**:
```bash
# Connect to database
psql -U impactlink -d impactlink_prod

# Check database size
SELECT pg_size_pretty(pg_database_size('impactlink_prod'));

# List all tables
\dt

# Check slow queries
SELECT query, calls, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC LIMIT 10;
```

### Day 4: Monitoring & Logging

**Topics**:
1. **Application Logs**
   - Log locations: `/var/log/impactlink/`
   - Log rotation: logrotate configuration
   - Log levels: debug, info, warn, error
   - Log aggregation tools

2. **System Monitoring**
   - CPU, memory, disk usage monitoring
   - Process monitoring (Node.js)
   - Network monitoring
   - Alert threshold configuration

3. **Health Checks**
   - Endpoint: `GET /api/v1/health`
   - Expected response: 200 OK with status info
   - Cron job scheduling
   - Alert notification

**Hands-on Practice**:
- Review recent application logs
- Check system resource usage
- Run health check script
- Review monitoring dashboard

### Day 5: Disaster Recovery

**Topics**:
1. **Backup Procedures**
   - Full backup schedule: daily at 02:00 SAST
   - Incremental backup: every hour
   - Backup verification
   - Backup retention policy

2. **Recovery Procedures**
   - Database point-in-time recovery
   - Application rollback
   - Full system restore from backup
   - Testing recovery procedures

3. **Incident Response**
   - Escalation procedures
   - Communication protocol
   - Post-incident review
   - Documentation requirements

**Hands-on Practice**:
- Execute a backup manually
- Verify backup integrity
- Simulate database recovery (staging)
- Practice incident communication

---

## Week 2: Operations & Troubleshooting

### Day 6: Common Operations Tasks

**Topics**:
1. **User Management**
   - Admin user creation
   - Password resets
   - Permission management
   - User account troubleshooting

2. **Feature Management**
   - Feature flags configuration
   - A/B testing setup
   - Gradual rollout procedures
   - Disabling problematic features

3. **Performance Tuning**
   - Query optimization
   - Cache management
   - Resource allocation
   - Monitoring optimization

**Common Commands**:
```bash
# Restart application
sudo systemctl restart impactlink-api

# View recent errors
tail -f /var/log/impactlink/error.log

# Check disk usage
df -h

# View process info
ps aux | grep node

# Clear cache (if needed)
redis-cli FLUSHDB
```

### Day 7: Troubleshooting Guide

**Topics**:
1. **High CPU Usage**
   - Identify problematic processes
   - Kill runaway processes
   - Review recent changes
   - Contact development team

2. **High Memory Usage**
   - Check for memory leaks
   - Review application logs
   - Restart application if necessary
   - Monitor after restart

3. **Database Connection Errors**
   - Check database status
   - Verify connection credentials
   - Clear connection pool
   - Restart database if needed

4. **Application Not Starting**
   - Check process status
   - Review startup logs
   - Verify dependencies installed
   - Check disk space
   - Verify configuration files

5. **Slow Response Times**
   - Check database query performance
   - Monitor cache hit ratio
   - Review recent deployments
   - Check system resources

### Day 8: Security & Access Control

**Topics**:
1. **Access Management**
   - SSH key management
   - User accounts and permissions
   - Firewall configuration
   - Rate limiting setup

2. **Security Best Practices**
   - Never store credentials in logs
   - Rotate secrets regularly
   - Monitor security logs
   - Keep systems patched

3. **Compliance**
   - Data retention policies
   - GDPR compliance verification
   - Audit trail maintenance
   - Incident documentation

**Security Checklist**:
- [ ] SSH keys properly configured
- [ ] Only necessary ports open
- [ ] SSL certificate valid and renewed
- [ ] Database credentials secure
- [ ] API keys not logged
- [ ] Backup encryption enabled
- [ ] Access logs monitored

### Day 9: Performance & Optimization

**Topics**:
1. **Performance Monitoring**
   - Response time trending
   - Error rate tracking
   - Throughput analysis
   - Resource utilization patterns

2. **Optimization Opportunities**
   - Database query optimization
   - Caching strategy improvement
   - API response optimization
   - Static asset optimization

3. **Capacity Planning**
   - Growth trending
   - Scaling requirements
   - Budget planning
   - Infrastructure upgrades

### Day 10: Knowledge Transfer & Certification

**Topics**:
1. **Final Review**
   - Quiz on key concepts
   - Scenario-based problem solving
   - Hands-on practical exam
   - Documentation review

2. **Certification Requirements**
   - Successfully deployed application
   - Executed backup and restore
   - Troubleshot common issues
   - Responded to simulated incidents

3. **Ongoing Learning**
   - Monthly training sessions
   - New feature walkthroughs
   - Architecture reviews
   - Best practices sharing

---

## Reference Materials

### Key Documentation
- `DEPLOYMENT_GUIDE.md` - Detailed deployment instructions
- `MONITORING_SECURITY.md` - Security and monitoring setup
- `DISASTER_RECOVERY_PLAN.md` - Incident and recovery procedures
- `PERFORMANCE_BASELINE.md` - Performance metrics and optimization
- `MAINTENANCE_PROCEDURES.md` - Regular maintenance tasks

### Important Contacts

**Team Leads**:
- Backend Lead: [To be updated]
- DevOps Lead: [To be updated]
- Security Lead: [To be updated]

**Vendor Support**:
- HostKing: [Support contact]
- AWS: [Support contact]

**On-Call Schedule**: [Link to on-call schedule]

### Tools & Access

**Production Environment**:
- cPanel URL: [To be updated]
- SSH Access: impactlink@[server-ip]
- Database Host: localhost
- Redis Host: localhost

**Staging Environment** (for testing):
- [To be documented]

**Monitoring Tools**:
- [To be documented]

---

## Training Assessment

### Knowledge Check

**Questions** (verify understanding):
1. What is the deployment process from code commit to production?
2. How do you perform a database backup and verify its integrity?
3. What are the steps to recover from a database corruption incident?
4. How do you identify and resolve high CPU usage?
5. What is the escalation path for critical incidents?

### Practical Skills

**Must-Perform Tasks**:
- [ ] Deploy application to staging
- [ ] Execute and verify a backup
- [ ] Restore from backup to staging
- [ ] Troubleshoot a simulated outage
- [ ] Respond to a simulated security alert
- [ ] Review and optimize a slow query
- [ ] Monitor system resources during peak load
- [ ] Execute a complete disaster recovery test

### Sign-Off

**Training Completion Checklist**:
- [ ] Completed all 10 days of training
- [ ] Passed knowledge assessment quiz
- [ ] Successfully completed practical tasks
- [ ] Shadowed on-call engineer (2 shifts)
- [ ] Responded to 3 real incidents with guidance
- [ ] Signed training acknowledgment

---

## Ongoing Support

### Daily Operations
- Monitor error logs
- Check resource utilization
- Verify daily backups completed
- Review security logs

### Weekly Tasks
- Review performance metrics
- Test backup restoration
- Analyze slow query logs
- Security patch updates

### Monthly Tasks
- Full disaster recovery test
- Capacity planning review
- Training for new team members
- Documentation updates

### Quarterly Tasks
- Architecture review
- Security audit
- Performance optimization assessment
- Disaster recovery drill

---

**Document Status**: ✅ Production Ready  
**Training Coordinator**: [To be assigned]  
**Next Review**: December 10, 2025

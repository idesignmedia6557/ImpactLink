# Disaster Recovery & Business Continuity Plan

## ImpactLink MVP - HostKing Production Environment

**Document Version**: 1.0  
**Last Updated**: November 10, 2025  
**Status**: Production Ready  
**RTO (Recovery Time Objective)**: 2 hours  
**RPO (Recovery Point Objective)**: 1 hour  

---

## Executive Summary

This document outlines the comprehensive disaster recovery (DR) and business continuity (BC) procedures for the ImpactLink MVP deployed on HostKing hosting. The plan ensures business continuity and rapid recovery in case of infrastructure failures, data loss, or security incidents.

**Key Metrics**:
- Recovery Time Objective (RTO): 2 hours maximum
- Recovery Point Objective (RPO): 1 hour maximum
- Backup Frequency: Hourly incremental, daily full
- Backup Retention: 30 days with 10 backups minimum
- Testing Frequency: Quarterly full DR test, monthly backup restoration test

---

## Risk Assessment

### Critical Infrastructure Components

1. **PostgreSQL Database** - CRITICAL
   - Data Loss Risk: High
   - Impact: Complete service outage
   - Mitigation: Hourly automated backups, WAL archiving, point-in-time recovery

2. **Application Server (Node.js)** - HIGH
   - Service Availability Risk: High
   - Impact: Partial service degradation
   - Mitigation: Health checks, automated restart, deployment automation

3. **File Storage (User Uploads)** - MEDIUM
   - Data Loss Risk: Medium
   - Impact: Loss of user-generated content
   - Mitigation: Daily incremental backups, versioning on S3

4. **Redis Cache** - MEDIUM
   - Service Availability Risk: Medium
   - Impact: Performance degradation, session loss
   - Mitigation: Cluster configuration, automatic failover

5. **DNS/Domain Configuration** - HIGH
   - Availability Risk: High
   - Impact: Service unreachability
   - Mitigation: Multiple DNS records, registrar redundancy

---

## Backup Strategy

### Database Backups

**Backup Schedule**:
```bash
# Full backup: Daily at 02:00 SAST
0 2 * * * /scripts/backup.sh full

# Incremental backup: Every hour
0 * * * * /scripts/backup.sh incremental

# Partial backup: Every 30 minutes (transaction logs)
*/30 * * * * /scripts/backup.sh partial
```

**Backup Locations**:
- Primary: `/backups/database/` on HostKing
- Secondary: AWS S3 (daily full backups)
- Tertiary: External encrypted drive (weekly full backups)

**Backup Verification**:
- Automated checksum validation
- Weekly restoration test to staging environment
- Monthly full DR simulation

### File Backups

**Backup Schedule**:
```bash
# Application files: Daily at 03:00 SAST
0 3 * * * /scripts/backup.sh app-files

# User uploads: Every 6 hours
0 */6 * * * /scripts/backup.sh user-uploads
```

**Retention Policy**:
- Last 30 daily backups maintained
- Last 10 full backups kept
- Automatic cleanup of older backups
- Backup size monitoring and alerts

---

## Disaster Recovery Procedures

### Scenario 1: Database Corruption/Data Loss

**Detection**:
- Automated monitoring alerts on database errors
- Failed transaction logs
- Integrity check failures

**Recovery Steps** (RTO: 60 minutes):

1. **Assess Damage** (5 minutes)
   - Determine point-in-time before corruption
   - Identify affected data/tables
   - Notify team and stakeholders

2. **Stop Application** (2 minutes)
   - Execute: `systemctl stop impactlink-api`
   - Set maintenance mode page
   - Notify users via status page

3. **Restore from Backup** (20 minutes)
   ```bash
   /scripts/restore.sh \
     --backup-type=full \
     --restore-point=2025-11-10T14:00:00Z \
     --database=impactlink_prod
   ```

4. **Verify Restoration** (15 minutes)
   - Check database integrity
   - Verify critical tables
   - Compare with backup manifest
   - Test key queries

5. **Restore Application** (5 minutes)
   - Execute: `systemctl start impactlink-api`
   - Wait for health checks to pass
   - Verify endpoint responses

6. **Monitoring & Validation** (15 minutes)
   - Monitor error logs
   - Check transaction processing
   - Verify data consistency
   - Document incident

### Scenario 2: Application Server Failure

**Detection**:
- Health check endpoint fails (3 consecutive failures)
- Process not responding
- High CPU/Memory usage

**Recovery Steps** (RTO: 15 minutes):

1. **Automatic Recovery** (1 minute)
   - Cron job triggers health check
   - Automatic service restart if failed
   - Alert sent if restart fails

2. **Manual Recovery if Needed** (5 minutes)
   ```bash
   /scripts/deploy.sh --rollback=last-known-good
   ```

3. **Verification** (5 minutes)
   - Test critical endpoints
   - Verify database connectivity
   - Check error logs

4. **Post-Recovery** (5 minutes)
   - Document incident
   - Analyze root cause
   - Update monitoring thresholds if needed

### Scenario 3: Storage/Disk Space Failure

**Detection**:
- Disk usage > 85% triggers alert
- Write operation failures
- Partition full errors

**Recovery Steps** (RTO: 30 minutes):

1. **Immediate Action** (2 minutes)
   - Stop accepting new file uploads
   - Trigger alert to admin
   - Check available backup space

2. **Cleanup Procedures** (10 minutes)
   ```bash
   # Remove old backups
   /scripts/cleanup-backups.sh --retain=5
   
   # Clean temporary files
   rm -rf /tmp/impactlink-*
   
   # Compress old logs
   find /var/log/impactlink -type f -name '*.log' -mtime +30 | xargs gzip
   ```

3. **Add Storage** (15 minutes)
   - Provision additional disk via HostKing
   - Mount new partition
   - Update backup paths if needed

4. **Resume Service** (3 minutes)
   - Re-enable file uploads
   - Verify disk space
   - Monitor growth

### Scenario 4: Network/DNS Failure

**Detection**:
- DNS resolution failures
- Network timeout errors
- Multiple ping failures from monitoring

**Recovery Steps** (RTO: 30 minutes):

1. **Verify DNS Status** (2 minutes)
   ```bash
   nslookup impactlink.solovedhelpinghands.org.za
   dig @8.8.8.8 impactlink.solovedhelpinghands.org.za
   ```

2. **Check HostKing Status** (3 minutes)
   - Log into cPanel
   - Verify server is running
   - Check network adapter status

3. **DNS Failover** (10 minutes)
   - Update DNS records to secondary server if available
   - Or contact HostKing support for network issue resolution

4. **Verification** (10 minutes)
   - Wait for DNS propagation (5-10 minutes)
   - Test connectivity from multiple locations
   - Verify SSL certificate validity

### Scenario 5: Security Breach/Ransomware

**Detection**:
- Unusual file modifications
- Suspicious process execution
- Unauthorized database access
- File encryption/ransom notes

**Recovery Steps** (RTO: 2 hours, varies by severity):

1. **Immediate Containment** (5 minutes)
   - Isolate affected system from network if possible
   - Stop application and database
   - Disable user access
   - Preserve logs for forensics

2. **Assessment** (10 minutes)
   - Identify affected systems/data
   - Check backup integrity
   - Review access logs
   - Contact security team

3. **Backup Verification** (10 minutes)
   - Verify clean backup point exists
   - Check backup hasn't been modified
   - Prepare restore environment

4. **Full System Restore** (45 minutes)
   - Restore from verified clean backup
   - Rebuild OS if necessary
   - Reinstall all applications
   - Verify no malware remains

5. **Post-Recovery** (30 minutes)
   - Security scanning
   - Change all credentials
   - Update firewall rules
   - Enable enhanced monitoring
   - Conduct incident post-mortem

---

## Business Continuity Procedures

### Communication Protocol

**During Incident**:
1. Page on-call team via PagerDuty
2. Post incident notification to Slack #incidents channel
3. Update status page every 15 minutes
4. Notify key stakeholders every 30 minutes

**Template**:
```
Incident: [Component] Failure
Time: [Timestamp]
Status: [Investigating/Recovering/Recovered]
ETA: [Estimated recovery time]
Impact: [Services affected, user impact]
Next Update: [Time]
```

### Escalation Path

- Level 1: Junior DevOps (First response)
- Level 2: Senior DevOps/Lead Engineer (If not resolved in 15 min)
- Level 3: CTO (If not resolved in 30 min)
- Level 4: CEO (If downtime > 1 hour)

### Incident Roles

**Incident Commander**: Coordinates recovery efforts, makes decisions
**Technical Lead**: Manages technical recovery procedures
**Communications Lead**: Updates status page and stakeholders
**Documentation Lead**: Records incident timeline and actions

---

## Testing & Validation

### Monthly Backup Restoration Test

**Procedure**:
1. Select random backup from last 30 days
2. Restore to staging environment
3. Verify data integrity
4. Test critical functionality
5. Document test results

**Success Criteria**:
- All data present in restored backup
- Database integrity checks pass
- Application functionality verified
- No corruption detected

### Quarterly Full DR Test

**Procedure**:
1. Schedule 4-hour maintenance window
2. Announce to users 48 hours prior
3. Perform full system backup
4. Restore to alternate server
5. Run complete test suite
6. Switch traffic to restored system (5 min)
7. Monitor for 30 minutes
8. Document findings and issues

**Success Criteria**:
- RTO met (< 2 hours)
- RPO verified (< 1 hour data loss)
- Zero data corruption
- All functionality operational

### Annual Comprehensive Review

- Review incident logs from past year
- Update RTO/RPO targets
- Assess new risks
- Update recovery procedures
- Update contact list and escalation paths
- Plan capacity upgrades

---

## Team Contacts

### On-Call Schedule

**Primary On-Call**:
- Name: [To be updated]
- Phone: [To be updated]
- Email: [To be updated]
- Hours: 24/7

**Secondary On-Call**:
- Name: [To be updated]
- Phone: [To be updated]
- Email: [To be updated]

**Escalation Contacts**:
- CTO: [To be updated]
- CEO: [To be updated]

### Vendor Support

**HostKing Support**:
- Phone: [Contact number]
- Portal: cPanel account
- Ticket System: Available 24/7

**AWS Support** (for S3 backups):
- AWS Console: aws.amazon.com
- Support Plan: Enterprise/Business

---

## Appendix

### A. Recovery Checklist Template

- [ ] Incident reported and confirmed
- [ ] Team notified and assembled
- [ ] Status page updated
- [ ] Stakeholders notified
- [ ] Assessment completed
- [ ] Recovery procedure started
- [ ] RTO timer started
- [ ] Recovery completed
- [ ] Verification completed
- [ ] Service restored and monitoring active
- [ ] Incident documented
- [ ] Root cause analysis started

### B. Useful Commands

```bash
# Check database status
psql -U impactlink -d impactlink_prod -c 'SELECT version();'

# View backup status
ls -lah /backups/database/

# Check disk usage
df -h
du -sh /backups/

# View recent errors
tail -100f /var/log/impactlink/error.log

# Restart services
sudo systemctl restart impactlink-api
sudo systemctl restart postgres
```

### C. References

- Deployment Guide: `DEPLOYMENT_GUIDE.md`
- Maintenance Procedures: `MAINTENANCE_PROCEDURES.md`
- Monitoring & Security: `MONITORING_SECURITY.md`
- HostKing Documentation: [Link to be added]
- PostgreSQL Recovery Docs: https://www.postgresql.org/docs/current/backup.html

---

**Document Status**: ✅ Production Ready  
**Next Review**: Q1 2026  
**Approval**: [To be signed by CTO]

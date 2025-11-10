# ImpactLink Production Go-Live Checklist

## Pre-Deployment (48 Hours Before)

### Infrastructure
- [ ] HostKing cPanel access verified for all team members
- [ ] SSH keys configured for secure access
- [ ] Firewall rules whitelisted for team IPs (if needed)
- [ ] Database backup completed and tested
- [ ] Backup restoration tested successfully
- [ ] Environment variables (.env) copied to production
- [ ] SSL certificate installed and valid
- [ ] DNS records prepared and verified

### Application
- [ ] Latest code merged to main branch
- [ ] All tests passing in CI/CD pipeline
- [ ] Build artifacts generated successfully
- [ ] Load testing completed (200+ users)
- [ ] Performance baseline recorded
- [ ] Security audit passed (0 critical issues)
- [ ] Error monitoring configured (Sentry)
- [ ] Logging configured (Winston/Morgan)

### Documentation
- [ ] Runbooks prepared for common issues
- [ ] Contact list created for on-call support
- [ ] Disaster recovery procedures tested
- [ ] Team trained on monitoring tools
- [ ] Communication plan established

---

## Deployment Day (Go-Live)

### Pre-Deployment (T-2 Hours)
- [ ] Team standby call initiated
- [ ] Monitoring dashboards opened
- [ ] Slack channels active for communication
- [ ] Rollback plan reviewed with team
- [ ] Database backup created (pre-deployment)

### Deployment (T-0)
- [ ] Pull latest code from repository
- [ ] Run database migrations
- [ ] Start application server
- [ ] Verify health check endpoint returns 200
- [ ] Test critical user flows manually
- [ ] Monitor error rate (should be <0.1%)
- [ ] Monitor response times (p95 < 500ms)

### Post-Deployment (T+30 Minutes)
- [ ] 100+ page loads without errors
- [ ] Test payment flow with test card
- [ ] Verify emails are sending
- [ ] Check all API endpoints responding
- [ ] Verify database connections healthy
- [ ] Redis cache working properly
- [ ] CDN serving static assets
- [ ] HTTPS working on all pages

### Post-Deployment (T+2 Hours)
- [ ] Monitor error rates trend toward zero
- [ ] CPU usage normal (<50%)
- [ ] Memory usage stable
- [ ] Database query times normal
- [ ] No slow queries in logs
- [ ] User count increasing naturally
- [ ] Charity partners reporting access
- [ ] Donors able to complete donations

---

## Post-Deployment (First Week)

### Daily Monitoring
- [ ] Error rates reviewed daily
- [ ] Performance metrics reviewed
- [ ] User feedback monitored
- [ ] Database backups automated
- [ ] Security logs reviewed
- [ ] Support tickets tracked

### First Week Verification
- [ ] 100+ successful donations processed
- [ ] All charity partners can login
- [ ] No critical bugs reported
- [ ] Performance baselines met
- [ ] Security incident response plan tested
- [ ] Backup restoration tested again

---

## Rollback Procedures (If Needed)

### Immediate Actions
- [ ] Stop application server
- [ ] Restore previous database backup
- [ ] Revert code to previous version
- [ ] Restart application
- [ ] Verify rollback successful
- [ ] Notify all stakeholders
- [ ] Document what caused the issue

### Post-Rollback
- [ ] Root cause analysis within 24 hours
- [ ] Fix identified issues
- [ ] Perform load testing again
- [ ] Security audit if needed
- [ ] Plan for re-deployment

---

## Success Criteria

✅ All services responding (200 status)
✅ Error rate < 0.1%
✅ Response time p95 < 500ms
✅ CPU usage < 70%
✅ Memory usage < 80%
✅ Database connections healthy
✅ Backups working
✅ SSL certificate valid
✅ Monitoring alerts configured
✅ Team trained and ready

---

## Launch Date

**Scheduled Go-Live**: [Date/Time]
**Domain**: https://impactlink.solovedhelpinghands.org.za
**Team Lead**: [Name]
**On-Call Support**: [Contact]
**Emergency Escalation**: [Contact]

---

**Last Updated**: November 10, 2025
**Status**: Production Ready ✅

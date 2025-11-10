# ImpactLink Monitoring & Security Guide

## Overview

This document covers monitoring, logging, and security hardening for ImpactLink deployment on HostKing.

## Monitoring Strategy

### Application Monitoring

**Health Checks**
- Automated health checks via `/api/health` endpoint
- HTTP status monitoring (200 = healthy)
- Response time tracking
- Database connectivity verification

**Cron Schedule**
```bash
# Every 5 minutes - basic health check
*/5 * * * * /home/user/scripts/health-check.sh

# Every hour - detailed monitoring with notifications
0 * * * * /home/user/scripts/health-check.sh --notify
```

**Health Check Coverage**
- Process status (Node.js running)
- HTTP endpoint availability
- Database connectivity
- Disk space usage
- Memory availability
- System load averages
- Critical files validation
- Application directory permissions

### Logging Strategy

**Application Logs**
- Location: `/home/user/logs/impactlink/app.log`
- Rotation: Daily, 30-day retention
- Format: JSON with timestamps

**Access Logs**
- Location: `/home/user/logs/impactlink/access.log`
- Includes: IP, method, path, status, response time
- Rotation: Daily

**Deployment Logs**
- Location: `/home/user/logs/impactlink/deployment.log`
- Records: All deployment attempts, status, rollbacks
- Rotation: Weekly

**System Logs**
- Location: `/home/user/logs/impactlink/system.log`
- Content: CPU, memory, disk usage trends
- Interval: 15-minute snapshots

### Log Aggregation

**Winston Configuration**
```javascript
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.errors({ stack: true })
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error'
    }),
    new winston.transports.File({ 
      filename: 'combined.log' 
    }),
    new winston.transports.DailyRotateFile({
      filename: 'application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '100m',
      maxDays: '30d'
    })
  ]
});
```

## Security Hardening

### SSL/TLS Configuration

**SSL Certificate Installation**
```bash
# HostKing Auto SSL via cPanel
1. Log in to cPanel
2. Navigate to AutoSSL
3. Select impactlink.solovedhelpinghands.org.za
4. Click Install
```

**Apache Configuration**
```apache
<VirtualHost *:443>
  ServerName impactlink.solovedhelpinghands.org.za
  ServerAlias www.impactlink.solovedhelpinghands.org.za
  
  SSLEngine on
  SSLCertificateFile /home/user/ssl/certificate.crt
  SSLCertificateKeyFile /home/user/ssl/private.key
  
  # Force HTTPS
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</VirtualHost>

# Redirect HTTP to HTTPS
<VirtualHost *:80>
  ServerName impactlink.solovedhelpinghands.org.za
  Redirect permanent / https://impactlink.solovedhelpinghands.org.za/
</VirtualHost>
```

### Security Headers

**Express Middleware**
```javascript
app.use((req, res, next) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );
  
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options (clickjacking prevention)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
});
```

### Rate Limiting

**Implementation**
```javascript
const rateLimit = require('express-rate-limit');

// General API rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts
  skipSuccessfulRequests: true
});

app.use('/api/', limiter);
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);
```

### CORS Configuration

**Express CORS**
```javascript
const cors = require('cors');

const corsOptions = {
  origin: [
    'https://impactlink.solovedhelpinghands.org.za',
    'https://www.impactlink.solovedhelpinghands.org.za'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

### Database Security

**Connection Security**
```javascript
// Use SSL for database connections
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `${process.env.DATABASE_URL}?sslmode=require`
    }
  }
});
```

**Credentials Management**
- Store all credentials in `.env` file (never commit)
- Use environment variables for sensitive data
- Rotate database passwords every 90 days
- Use strong passwords (minimum 32 characters)

### Environment Variables

**Required Security Variables**
```
DATABASE_URL=postgresql://user:password@localhost/impactlink_db?sslmode=require
NODE_ENV=production
JWT_SECRET=<long-random-string>
REFRESH_TOKEN_SECRET=<long-random-string>
API_KEY=<generated-api-key>
STRIPE_SECRET_KEY=<stripe-credentials>
EMAIL_PASSWORD=<email-service-password>
SESSION_SECRET=<session-encryption-secret>
```

### Access Control

**File Permissions**
```bash
# Application directory
chmod 755 /home/user/public_html/impactlink

# Config files (readable by app only)
chmod 600 /home/user/public_html/impactlink/.env
chmod 600 /home/user/public_html/impactlink/.env.production

# Log files
chmod 750 /home/user/logs/impactlink
chmod 640 /home/user/logs/impactlink/*.log

# Backup files
chmod 750 /home/user/backups/impactlink
chmod 640 /home/user/backups/impactlink/*.tar.gz
```

### User Roles & Permissions

**Database User**
```sql
-- Create limited application user
CREATE USER impactlink_app WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE impactlink_db TO impactlink_app;
GRANT USAGE ON SCHEMA public TO impactlink_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO impactlink_app;

-- Admin user (for migrations only)
CREATE USER impactlink_admin WITH PASSWORD 'strong_admin_password';
GRANT ALL PRIVILEGES ON DATABASE impactlink_db TO impactlink_admin;
```

## Alerting

### Alert Triggers

1. **High CPU Usage** (>80% for 5 minutes)
   - Action: Check process, consider reboot
   - Notification: Email to admin

2. **High Memory Usage** (>90%)
   - Action: Check for memory leaks
   - Notification: Immediate alert

3. **Disk Space Low** (>85% usage)
   - Action: Clean old backups, request expansion
   - Notification: Email to admin

4. **API Unavailable** (3 consecutive failures)
   - Action: Auto-restart application
   - Notification: Immediate alert

5. **Database Connection Failed**
   - Action: Check database service
   - Notification: Immediate alert

### Notification Methods

**Email Alerts**
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function sendAlert(subject, message) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: `[ALERT] ${subject}`,
    html: message
  });
}
```

## Compliance & Auditing

### Access Logging
- All user logins recorded
- API requests with user ID and action
- Admin actions separately logged
- Retention: 1 year

### Audit Trail
- Database changes tracked
- User creation/modification/deletion
- Donation processing
- Report generation

### Regular Security Reviews
- Weekly: Check logs for anomalies
- Monthly: Review access logs
- Quarterly: Security assessment
- Annually: Penetration testing

## Incident Response

### Breach Detection
1. Monitor for unusual query patterns
2. Check for unexpected user accounts
3. Review failed login attempts
4. Analyze anomalous data access

### Response Steps
1. Isolate affected systems
2. Preserve logs and evidence
3. Notify affected users
4. Implement fixes
5. Restore from clean backup
6. Post-incident review

## Testing

### Security Testing
```bash
# SSL/TLS Configuration
echo | openssl s_client -servername impactlink.solovedhelpinghands.org.za \
  -connect impactlink.solovedhelpinghands.org.za:443 2>/dev/null | openssl x509 -noout -dates

# Check for security headers
curl -I https://impactlink.solovedhelpinghands.org.za | grep -i "security\|strict\|csp"

# Test rate limiting
for i in {1..10}; do curl https://impactlink.solovedhelpinghands.org.za/api/test; done
```

## Maintenance Schedule

| Task | Frequency | Owner |
|------|-----------|-------|
| Health checks | Every 5 min | Automated |
| Log review | Daily | Admin |
| Backup verification | Daily | Automated |
| SSL cert renewal | 30 days before expiry | Automated |
| Security updates | As released | Admin |
| Password rotation | Quarterly | Admin |
| Disaster recovery test | Semi-annually | Admin |
| Penetration testing | Annually | External |

## References

- [OWASP Top 10](https://owasp.org/Top10)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax.html)

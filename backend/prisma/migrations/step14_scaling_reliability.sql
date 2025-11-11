-- Step 14: Scaling & Platform Reliability - Database Schema Enhancements
-- This migration adds performance optimization tables and monitoring infrastructure

-- Create Monitoring Configuration table for tracking system metrics
CREATE TABLE IF NOT EXISTS "MonitoringConfig" (
  "id" SERIAL PRIMARY KEY,
  "componentName" VARCHAR(100) NOT NULL UNIQUE,
  "alertThreshold" DECIMAL(10, 2),
  "warningThreshold" DECIMAL(10, 2),
  "metricsType" VARCHAR(50),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create API Performance Log table for tracking endpoint performance
CREATE TABLE IF NOT EXISTS "APIPerformanceLog" (
  "id" SERIAL PRIMARY KEY,
  "endpoint" VARCHAR(255) NOT NULL,
  "method" VARCHAR(10),
  "statusCode" INTEGER,
  "responseTime" INTEGER,
  "requestSize" INTEGER,
  "responseSize" INTEGER,
  "userId" INTEGER REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Database Query Performance Log table
CREATE TABLE IF NOT EXISTS "DatabaseQueryLog" (
  "id" SERIAL PRIMARY KEY,
  "query" TEXT,
  "executionTime" INTEGER,
  "rowsAffected" INTEGER,
  "isSlowQuery" BOOLEAN DEFAULT false,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create System Alert table for tracking system-wide alerts
CREATE TABLE IF NOT EXISTS "SystemAlert" (
  "id" SERIAL PRIMARY KEY,
  "alertType" VARCHAR(50) NOT NULL,
  "severity" VARCHAR(20),
  "message" TEXT,
  "componentName" VARCHAR(100),
  "metadata" JSONB,
  "isResolved" BOOLEAN DEFAULT false,
  "resolvedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Backup Status table for tracking backup operations
CREATE TABLE IF NOT EXISTS "BackupStatus" (
  "id" SERIAL PRIMARY KEY,
  "backupType" VARCHAR(50),
  "startTime" TIMESTAMP,
  "endTime" TIMESTAMP,
  "status" VARCHAR(20),
  "backupSize" BIGINT,
  "storageLocation" VARCHAR(255),
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Incident Report table for tracking incidents
CREATE TABLE IF NOT EXISTS "IncidentReport" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "severity" VARCHAR(20),
  "status" VARCHAR(50),
  "startTime" TIMESTAMP,
  "endTime" TIMESTAMP,
  "affectedComponents" TEXT[],
  "rootCause" TEXT,
  "resolution" TEXT,
  "createdBy" INTEGER REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Support Ticket table for customer support
CREATE TABLE IF NOT EXISTS "SupportTicket" (
  "id" SERIAL PRIMARY KEY,
  "ticketNumber" VARCHAR(50) NOT NULL UNIQUE,
  "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "category" VARCHAR(100),
  "subject" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "priority" VARCHAR(20),
  "status" VARCHAR(50),
  "assignedTo" INTEGER REFERENCES "User"("id") ON DELETE SET NULL,
  "resolutionTime" INTEGER,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMP
);

-- Create Support Ticket Response table
CREATE TABLE IF NOT EXISTS "SupportTicketResponse" (
  "id" SERIAL PRIMARY KEY,
  "ticketId" INTEGER NOT NULL REFERENCES "SupportTicket"("id") ON DELETE CASCADE,
  "responderId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE SET NULL,
  "message" TEXT,
  "attachments" TEXT[],
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create FAQ table for knowledge base
CREATE TABLE IF NOT EXISTS "FAQ" (
  "id" SERIAL PRIMARY KEY,
  "category" VARCHAR(100) NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "helpfulness" INTEGER DEFAULT 0,
  "views" INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "order" INTEGER,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Cache Configuration table
CREATE TABLE IF NOT EXISTS "CacheConfig" (
  "id" SERIAL PRIMARY KEY,
  "cacheKey" VARCHAR(255) NOT NULL UNIQUE,
  "ttlSeconds" INTEGER,
  "cacheType" VARCHAR(50),
  "priority" VARCHAR(20),
  "lastUpdated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Rate Limit Configuration table
CREATE TABLE IF NOT EXISTS "RateLimitConfig" (
  "id" SERIAL PRIMARY KEY,
  "endpoint" VARCHAR(255) NOT NULL,
  "requestsPerMinute" INTEGER,
  "requestsPerHour" INTEGER,
  "requestsPerDay" INTEGER,
  "ipAddress" VARCHAR(50),
  "userId" INTEGER REFERENCES "User"("id") ON DELETE SET NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Infrastructure Status table
CREATE TABLE IF NOT EXISTS "InfrastructureStatus" (
  "id" SERIAL PRIMARY KEY,
  "componentName" VARCHAR(100) NOT NULL,
  "status" VARCHAR(50),
  "uptime" DECIMAL(5, 2),
  "cpu" DECIMAL(5, 2),
  "memory" DECIMAL(5, 2),
  "disk" DECIMAL(5, 2),
  "lastChecked" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS "idx_api_performance_endpoint" ON "APIPerformanceLog"("endpoint");
CREATE INDEX IF NOT EXISTS "idx_api_performance_created" ON "APIPerformanceLog"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_api_performance_response_time" ON "APIPerformanceLog"("responseTime");
CREATE INDEX IF NOT EXISTS "idx_database_query_slow" ON "DatabaseQueryLog"("isSlowQuery");
CREATE INDEX IF NOT EXISTS "idx_system_alert_type" ON "SystemAlert"("alertType");
CREATE INDEX IF NOT EXISTS "idx_system_alert_created" ON "SystemAlert"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_backup_status_created" ON "BackupStatus"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_incident_status" ON "IncidentReport"("status");
CREATE INDEX IF NOT EXISTS "idx_support_ticket_user" ON "SupportTicket"("userId");
CREATE INDEX IF NOT EXISTS "idx_support_ticket_status" ON "SupportTicket"("status");
CREATE INDEX IF NOT EXISTS "idx_faq_category" ON "FAQ"("category");
CREATE INDEX IF NOT EXISTS "idx_faq_active" ON "FAQ"("isActive");
CREATE INDEX IF NOT EXISTS "idx_infrastructure_component" ON "InfrastructureStatus"("componentName");

-- Seed common alert configurations
INSERT INTO "MonitoringConfig" ("componentName", "alertThreshold", "warningThreshold", "metricsType") VALUES
  ('API_Response_Time', 5000, 2000, 'milliseconds'),
  ('Database_Connection_Pool', 100, 80, 'count'),
  ('CPU_Usage', 90, 70, 'percentage'),
  ('Memory_Usage', 90, 80, 'percentage'),
  ('Disk_Usage', 90, 80, 'percentage'),
  ('Error_Rate', 5, 1, 'percentage'),
  ('Uptime', 99, 99.5, 'percentage')
ON CONFLICT ("componentName") DO NOTHING;

-- Seed common FAQ categories
INSERT INTO "FAQ" ("category", "question", "answer", "order") VALUES
  ('Getting Started', 'How do I create an account?', 'Visit our registration page and fill in your email, name, and password. Verify your email to activate your account.', 1),
  ('Getting Started', 'What is a donor account?', 'A donor account allows you to browse projects, donate to causes, and track your impact.', 2),
  ('Donations', 'What payment methods do you accept?', 'We accept all major credit/debit cards through Stripe. Bank transfers available for large donations.', 3),
  ('Donations', 'Can I get a tax receipt?', 'Yes, tax receipts are automatically emailed after each donation and available in your dashboard.', 4),
  ('For Charities', 'How do I register my charity?', 'Go to Charity Registration, provide your EIN/registration number, and submit verification documents.', 5),
  ('For Charities', 'How long does charity verification take?', 'Verification typically takes 3-5 business days. We review your documents and reach out if we need clarification.', 6),
  ('Technical Issues', 'Why is the page loading slowly?', 'Please try clearing your browser cache or using a different browser. Contact support if issues persist.', 7),
  ('Security & Privacy', 'Is my data secure?', 'Yes, we use industry-standard encryption and security protocols. Your data is never shared without permission.', 8)
ON CONFLICT DO NOTHING;

-- Create view for system health dashboard
CREATE OR REPLACE VIEW "SystemHealthDashboard" AS
SELECT 
  'API Performance' as metric,
  AVG(CAST("responseTime" AS NUMERIC)) as avg_value,
  MAX("responseTime") as max_value,
  COUNT(*) as data_points,
  NOW() as last_updated
FROM "APIPerformanceLog"
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 
  'Database Queries',
  AVG("executionTime"),
  MAX("executionTime"),
  COUNT(*),
  NOW()
FROM "DatabaseQueryLog"
WHERE "createdAt" > NOW() - INTERVAL '1 hour';

-- Grant monitoring permissions
GRANT SELECT ON "MonitoringConfig" TO PUBLIC;
GRANT SELECT ON "APIPerformanceLog" TO PUBLIC;
GRANT SELECT ON "SystemAlert" TO PUBLIC;
GRANT SELECT ON "SystemHealthDashboard" TO PUBLIC;

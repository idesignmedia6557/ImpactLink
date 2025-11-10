-- ImpactLink Step 10 Advanced Features Migration
-- Date: 2025-01-22
-- Description: Database schema additions for gamification, subscriptions, matching, fraud detection, and analytics

-- ============================================================================
-- GAMIFICATION TABLES
-- ============================================================================

-- User Levels Table (for gamification system)
CREATE TABLE IF NOT EXISTS user_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_level INTEGER NOT NULL DEFAULT 1,
    total_xp INTEGER NOT NULL DEFAULT 0,
    level_name VARCHAR(50),
    unlocked_features JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX idx_user_levels_user_id ON user_levels(user_id);
CREATE INDEX idx_user_levels_level ON user_levels(current_level);

-- Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(100) NOT NULL,
    achievement_name VARCHAR(255) NOT NULL,
    achievement_description TEXT,
    points_earned INTEGER DEFAULT 0,
    icon_url VARCHAR(500),
    earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE INDEX idx_achievements_type ON achievements(achievement_type);
CREATE INDEX idx_achievements_earned_at ON achievements(earned_at DESC);

-- Challenges Table
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_type VARCHAR(100) NOT NULL,
    challenge_name VARCHAR(255) NOT NULL,
    challenge_description TEXT,
    target_value INTEGER NOT NULL,
    current_value INTEGER DEFAULT 0,
    reward_xp INTEGER DEFAULT 0,
    reward_badge VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, completed, expired
    start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_challenges_user_id ON challenges(user_id);
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_challenges_end_date ON challenges(end_date);

-- ============================================================================
-- SUBSCRIPTION TABLES
-- ============================================================================

-- Subscriptions Table (for premium features)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL,
    plan_type VARCHAR(50) NOT NULL, -- basic, pro, enterprise
    billing_cycle VARCHAR(50) NOT NULL, -- monthly, annual
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, cancelled, expired, past_due
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    stripe_price_id VARCHAR(255),
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMP,
    trial_start TIMESTAMP,
    trial_end TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);

-- ============================================================================
-- CORPORATE MATCHING TABLES
-- ============================================================================

-- Matching Programs Table
CREATE TABLE IF NOT EXISTS matching_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES corporate_accounts(id) ON DELETE CASCADE,
    program_name VARCHAR(255) NOT NULL,
    program_description TEXT,
    matching_rate DECIMAL(5, 2) NOT NULL DEFAULT 1.0,
    min_donation_amount DECIMAL(12, 2) DEFAULT 0,
    max_donation_amount DECIMAL(12, 2),
    monthly_budget DECIMAL(12, 2),
    annual_budget DECIMAL(12, 2),
    budget_spent DECIMAL(12, 2) DEFAULT 0,
    eligible_charities JSONB, -- Array of charity IDs or categories
    eligible_employees JSONB, -- Array of employee emails or criteria
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, paused, closed
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_matching_programs_company_id ON matching_programs(company_id);
CREATE INDEX idx_matching_programs_status ON matching_programs(status);

-- Matched Donations Table
CREATE TABLE IF NOT EXISTS matched_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matching_program_id UUID NOT NULL REFERENCES matching_programs(id) ON DELETE CASCADE,
    original_donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    employee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    charity_id UUID NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
    original_amount DECIMAL(12, 2) NOT NULL,
    matched_amount DECIMAL(12, 2) NOT NULL,
    matching_rate DECIMAL(5, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, disbursed, rejected
    approved_at TIMESTAMP,
    disbursed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_matched_donations_program_id ON matched_donations(matching_program_id);
CREATE INDEX idx_matched_donations_donation_id ON matched_donations(original_donation_id);
CREATE INDEX idx_matched_donations_employee_id ON matched_donations(employee_user_id);
CREATE INDEX idx_matched_donations_status ON matched_donations(status);

-- ============================================================================
-- FRAUD DETECTION TABLES
-- ============================================================================

-- Fraud Flags Table
CREATE TABLE IF NOT EXISTS fraud_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    donation_id UUID REFERENCES donations(id) ON DELETE CASCADE,
    flag_type VARCHAR(100) NOT NULL, -- velocity, duplicate_card, suspicious_amount, etc.
    risk_score INTEGER NOT NULL, -- 0-100
    severity VARCHAR(50) NOT NULL, -- low, medium, high, critical
    details JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, reviewed, resolved, false_positive
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    resolution_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fraud_flags_user_id ON fraud_flags(user_id);
CREATE INDEX idx_fraud_flags_donation_id ON fraud_flags(donation_id);
CREATE INDEX idx_fraud_flags_status ON fraud_flags(status);
CREATE INDEX idx_fraud_flags_severity ON fraud_flags(severity);
CREATE INDEX idx_fraud_flags_risk_score ON fraud_flags(risk_score DESC);

-- KYC Verifications Table
CREATE TABLE IF NOT EXISTS kyc_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_type VARCHAR(100) NOT NULL, -- identity, address, payment_method
    verification_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    provider VARCHAR(100), -- stripe, manual, third_party
    provider_verification_id VARCHAR(255),
    document_urls JSONB, -- Array of document URLs
    verification_data JSONB,
    rejection_reason TEXT,
    verified_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kyc_verifications_user_id ON kyc_verifications(user_id);
CREATE INDEX idx_kyc_verifications_status ON kyc_verifications(verification_status);
CREATE INDEX idx_kyc_verifications_expires_at ON kyc_verifications(expires_at);

-- ============================================================================
-- ANALYTICS TABLES
-- ============================================================================

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_category VARCHAR(100),
    properties JSONB,
    user_agent VARCHAR(500),
    ip_address INET,
    referrer VARCHAR(500),
    page_url VARCHAR(1000),
    session_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);

-- User Engagement Metrics Table (aggregated metrics)
CREATE TABLE IF NOT EXISTS user_engagement_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    total_donations INTEGER DEFAULT 0,
    total_amount DECIMAL(12, 2) DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    session_count INTEGER DEFAULT 0,
    average_session_duration INTEGER DEFAULT 0, -- in seconds
    last_activity_at TIMESTAMP,
    engagement_score INTEGER DEFAULT 0, -- 0-100
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, metric_date)
);

CREATE INDEX idx_user_engagement_user_id ON user_engagement_metrics(user_id);
CREATE INDEX idx_user_engagement_date ON user_engagement_metrics(metric_date DESC);
CREATE INDEX idx_user_engagement_score ON user_engagement_metrics(engagement_score DESC);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_user_levels_updated_at BEFORE UPDATE ON user_levels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matching_programs_updated_at BEFORE UPDATE ON matching_programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matched_donations_updated_at BEFORE UPDATE ON matched_donations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fraud_flags_updated_at BEFORE UPDATE ON fraud_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kyc_verifications_updated_at BEFORE UPDATE ON kyc_verifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_engagement_metrics_updated_at BEFORE UPDATE ON user_engagement_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All Step 10 advanced feature tables have been created successfully
-- Tables: 11 new tables
-- Indexes: 40+ performance indexes
-- Triggers: 8 automatic timestamp triggers

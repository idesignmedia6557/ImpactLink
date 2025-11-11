-- Step 13: User Onboarding & Growth Features - Database Migration
-- Date: November 2025
-- Adds tables and columns for onboarding, trust building, and community growth features

-- 1. Extend User table with onboarding fields
ALTER TABLE "User" ADD COLUMN "onboardingStep" INTEGER DEFAULT 1;
ALTER TABLE "User" ADD COLUMN "completedOnboarding" BOOLEAN DEFAULT FALSE;
ALTER TABLE "User" ADD COLUMN "registeredAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN "referralCode" VARCHAR(50) UNIQUE;
ALTER TABLE "User" ADD COLUMN "referredById" INTEGER REFERENCES "User"(id) ON DELETE SET NULL;
ALTER TABLE "User" ADD COLUMN "lastLogin" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN "completedTours" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 2. Create Testimonial table for trust building
CREATE TABLE "Testimonial" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "content" TEXT NOT NULL,
  "author" VARCHAR(255) NOT NULL,
  "role" VARCHAR(50) NOT NULL CHECK ("role" IN ('donor', 'charity', 'beneficiary')),
  "image" VARCHAR(500),
  "verified" BOOLEAN DEFAULT FALSE,
  "featured" BOOLEAN DEFAULT FALSE,
  "approvedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE INDEX "idx_testimonial_verified" ON "Testimonial"("verified");
CREATE INDEX "idx_testimonial_role" ON "Testimonial"("role");

-- 3. Create ProjectMedia table for photos/videos from funded projects
CREATE TABLE "ProjectMedia" (
  "id" SERIAL PRIMARY KEY,
  "projectId" INTEGER NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
  "url" VARCHAR(500) NOT NULL,
  "type" VARCHAR(50) NOT NULL CHECK ("type" IN ('image', 'video')),
  "caption" TEXT,
  "uploadedBy" INTEGER REFERENCES "User"(id),
  "uploadedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" TIMESTAMP
);

CREATE INDEX "idx_projectmedia_project" ON "ProjectMedia"("projectId");

-- 4. Create Referral table for tracking referrals
CREATE TABLE "Referral" (
  "id" SERIAL PRIMARY KEY,
  "referrerId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "referredUserId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "referralCode" VARCHAR(50) UNIQUE,
  "donationAmount" DECIMAL(10, 2),
  "badgeAwarded" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "convertedAt" TIMESTAMP
);

CREATE INDEX "idx_referral_referrer" ON "Referral"("referrerId");
CREATE INDEX "idx_referral_referred" ON "Referral"("referredUserId");
CREATE INDEX "idx_referral_code" ON "Referral"("referralCode");

-- 5. Create Challenge table for monthly impact challenges
CREATE TABLE "Challenge" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  "targetAmount" DECIMAL(12, 2) NOT NULL,
  "currentAmount" DECIMAL(12, 2) DEFAULT 0,
  "participantCount" INTEGER DEFAULT 0,
  "badge" VARCHAR(100),
  "status" VARCHAR(50) DEFAULT 'upcoming' CHECK ("status" IN ('upcoming', 'active', 'completed')),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_challenge_status" ON "Challenge"("status");
CREATE INDEX "idx_challenge_dates" ON "Challenge"("startDate", "endDate");

-- 6. Create ChallengeParticipant table
CREATE TABLE "ChallengeParticipant" (
  "id" SERIAL PRIMARY KEY,
  "challengeId" INTEGER NOT NULL REFERENCES "Challenge"(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "donated" DECIMAL(12, 2) DEFAULT 0,
  "joinedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "completed" BOOLEAN DEFAULT FALSE,
  UNIQUE("challengeId", "userId")
);

CREATE INDEX "idx_challengeparticipant_challenge" ON "ChallengeParticipant"("challengeId");
CREATE INDEX "idx_challengeparticipant_user" ON "ChallengeParticipant"("userId");

-- 7. Create OnboardingEmail table to track sent emails
CREATE TABLE "OnboardingEmail" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "emailType" VARCHAR(100) NOT NULL,
  "sentAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "opened" BOOLEAN DEFAULT FALSE,
  "openedAt" TIMESTAMP
);

CREATE INDEX "idx_onboarding_email_user" ON "OnboardingEmail"("userId");

-- 8. Create BadgeType enum and BadgeAward tracking
CREATE TABLE "BadgeType" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) UNIQUE NOT NULL,
  "description" TEXT,
  "icon" VARCHAR(500),
  "criteria" TEXT
);

-- Insert initial badge types
INSERT INTO "BadgeType" ("name", "description") VALUES 
  ('first_donation', 'Made their first donation'),
  ('impact_10', 'Funded 10 impact units'),
  ('impact_50', 'Funded 50 impact units'),
  ('repeat_donor', 'Made 5+ donations'),
  ('referrer', 'Successfully referred 3+ users'),
  ('challenge_participant', 'Participated in a challenge'),
  ('verified_donor', 'Verified profile complete');

CREATE TABLE "BadgeAward" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "badgeTypeId" INTEGER NOT NULL REFERENCES "BadgeType"(id),
  "awardedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("userId", "badgeTypeId")
);

CREATE INDEX "idx_badge_award_user" ON "BadgeAward"("userId");

-- 9. Create SocialShare tracking table
CREATE TABLE "SocialShare" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "User"(id) ON DELETE SET NULL,
  "donationId" INTEGER REFERENCES "Donation"(id) ON DELETE CASCADE,
  "platform" VARCHAR(50) CHECK ("platform" IN ('facebook', 'twitter', 'linkedin', 'email')),
  "sharedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_socialshare_user" ON "SocialShare"("userId");
CREATE INDEX "idx_socialshare_donation" ON "SocialShare"("donationId");

-- 10. Add verification fields to Charity table
ALTER TABLE "Charity" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP;
ALTER TABLE "Charity" ADD COLUMN IF NOT EXISTS "verificationNotes" TEXT;

-- 11. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_user_referral_code" ON "User"("referralCode");
CREATE INDEX IF NOT EXISTS "idx_donation_timestamp" ON "Donation"("timestamp");
CREATE INDEX IF NOT EXISTS "idx_user_created_at" ON "User"("registeredAt");

-- Commit message: feat(step13): Add database migrations for onboarding, trust, and growth features

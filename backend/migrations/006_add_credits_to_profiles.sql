-- ============================================
-- Innovix — Database Schema Migration
-- Version: 006 — Add Credits and Referrals to Profiles
-- ============================================

-- Add new columns to the profiles table
ALTER TABLE profiles
ADD COLUMN credits INT DEFAULT 1,
ADD COLUMN last_replenished_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN referral_code TEXT UNIQUE,
ADD COLUMN referred_by TEXT;

-- Create an index on the referral code for quick lookups
CREATE INDEX idx_profiles_referral_code ON profiles(referral_code);

-- Generate unique referral codes for existing users
-- We use a combination of the first part of their ID and a random string
UPDATE profiles 
SET referral_code = 'inv-' || substr(id::text, 1, 8) 
WHERE referral_code IS NULL;

-- Make the referral_code NOT NULL after backfilling
ALTER TABLE profiles 
ALTER COLUMN referral_code SET NOT NULL;

-- Automatically generate a referral code when a new profile is created
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, avatar_url, referral_code)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        'inv-' || substr(NEW.id::text, 1, 8)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

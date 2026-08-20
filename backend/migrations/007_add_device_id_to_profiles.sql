-- ============================================
-- Innovix — Database Schema Migration
-- Version: 007 — Add Device Fingerprinting to Profiles
-- ============================================

-- Add new column to the profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Create an index on the device_id for quick lookups during referral redemption
CREATE INDEX IF NOT EXISTS idx_profiles_device_id ON profiles(device_id);

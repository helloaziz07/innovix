-- ============================================
-- Innovix — Database Schema Migration
-- Version: 003 — Add is_pinned to projects
-- Run this in your Supabase SQL Editor
-- ============================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Optional: create an index for faster filtering of pinned projects
CREATE INDEX IF NOT EXISTS idx_projects_is_pinned ON projects(is_pinned);

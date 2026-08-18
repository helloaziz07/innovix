-- Migration to add alias_name for custom invitations
ALTER TABLE project_invitations ADD COLUMN IF NOT EXISTS alias_name TEXT;
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS alias_name TEXT;

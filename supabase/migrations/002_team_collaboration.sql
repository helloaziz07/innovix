-- ============================================
-- Innovix — Supabase Migration 002
-- Team Collaboration & Invitations
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Project Members Table
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(project_id, user_id)
);

-- 2. Project Invitations Table
CREATE TABLE IF NOT EXISTS project_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);

-- ============================================
-- Row Level Security Updates
-- ============================================

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_invitations ENABLE ROW LEVEL SECURITY;

-- Project Members RLS
CREATE POLICY "Users can view members of their projects"
    ON project_members FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
        OR
        project_id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can manage members"
    ON project_members FOR ALL
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Project Invitations RLS
CREATE POLICY "Project owners can manage invitations"
    ON project_invitations FOR ALL
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Update existing Policies for Team Members
-- Projects: Allow editors/viewers to select
CREATE POLICY "Members can view projects"
    ON projects FOR SELECT
    USING (
        id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
    );

-- Projects: Allow editors to update
CREATE POLICY "Editors can update projects"
    ON projects FOR UPDATE
    USING (
        id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role = 'editor')
    );

-- Search Results: Allow members to view
CREATE POLICY "Members can view search results"
    ON search_results FOR SELECT
    USING (
        project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
    );

-- Search Results: Allow editors to insert
CREATE POLICY "Editors can insert search results"
    ON search_results FOR INSERT
    WITH CHECK (
        project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role = 'editor')
    );

-- Workspaces: Allow members to view
CREATE POLICY "Members can view workspaces"
    ON workspaces FOR SELECT
    USING (
        project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
    );

-- Workspaces: Allow editors to manage
CREATE POLICY "Editors can manage workspaces"
    ON workspaces FOR ALL
    USING (
        project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role = 'editor')
    );

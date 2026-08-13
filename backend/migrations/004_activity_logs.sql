-- ============================================
-- Innovix — Supabase Migration 004
-- Activity Logs and View Tracking
-- ============================================

-- 1. Project Activity Logs
CREATE TABLE IF NOT EXISTS project_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    component TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Project User Views (For Unread Badges)
CREATE TABLE IF NOT EXISTS project_user_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_viewed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(project_id, user_id)
);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE project_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_user_views ENABLE ROW LEVEL SECURITY;

-- Project Activity Logs RLS
CREATE POLICY "Users can view activity logs for their projects"
    ON project_activity_logs FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
        OR
        project_id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert activity logs for their projects"
    ON project_activity_logs FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
        OR
        project_id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

-- Project User Views RLS
CREATE POLICY "Users can manage their own project views"
    ON project_user_views FOR ALL
    USING (user_id = auth.uid());

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON project_activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON project_activity_logs(created_at DESC);

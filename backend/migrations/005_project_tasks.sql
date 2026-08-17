-- Add technical_role to project members and invitations
ALTER TABLE public.project_members ADD COLUMN IF NOT EXISTS technical_role VARCHAR;
ALTER TABLE public.project_invitations ADD COLUMN IF NOT EXISTS technical_role VARCHAR;

-- Create project tasks table
CREATE TABLE IF NOT EXISTS public.project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    description TEXT,
    required_role VARCHAR,
    estimated_effort VARCHAR, -- e.g., 'low', 'medium', 'high'
    status VARCHAR DEFAULT 'todo', -- 'todo', 'in_progress', 'done'
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) policies for project_tasks
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- Allow members of the project to view tasks
CREATE POLICY "Members can view project tasks"
    ON public.project_tasks
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_members.project_id = project_tasks.project_id 
            AND project_members.user_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_tasks.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Allow members of the project to insert tasks
CREATE POLICY "Members can insert project tasks"
    ON public.project_tasks
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_members.project_id = project_tasks.project_id 
            AND project_members.user_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_tasks.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Allow members of the project to update tasks
CREATE POLICY "Members can update project tasks"
    ON public.project_tasks
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_members.project_id = project_tasks.project_id 
            AND project_members.user_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_tasks.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Allow members to delete tasks
CREATE POLICY "Members can delete project tasks"
    ON public.project_tasks
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_members.project_id = project_tasks.project_id 
            AND project_members.user_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_tasks.project_id
            AND projects.user_id = auth.uid()
        )
    );

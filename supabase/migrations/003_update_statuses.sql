-- Migration: Update Project Statuses to 'planning', 'architecting', 'completed'

-- 1. Update existing records
UPDATE projects 
SET status = 'planning' 
WHERE status IN ('ideation', 'researching');

UPDATE projects 
SET status = 'architecting' 
WHERE status = 'building';

-- 2. Drop the existing constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- 3. Add the new constraint
ALTER TABLE projects ADD CONSTRAINT projects_status_check 
CHECK (status IN ('planning', 'architecting', 'completed'));

-- 4. Set the default status for new projects
ALTER TABLE projects ALTER COLUMN status SET DEFAULT 'planning';

-- Enable Supabase Realtime for the projects table
-- This allows clients to subscribe to postgres_changes for live sync

begin;
  -- Add projects table to the publication if it's not already there
  do $$
  begin
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime' and tablename = 'projects'
    ) then
      alter publication supabase_realtime add table projects;
    end if;
  end
  $$;
commit;

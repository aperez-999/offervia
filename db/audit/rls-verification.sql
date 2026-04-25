-- Offervia RLS verification pack
-- Run in the Supabase SQL editor after schema + policies are applied.
-- This script is intentionally read-only / proof-oriented.

-- 1) Confirm RLS is enabled on all user data tables.
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'applications',
    'messages',
    'profiles',
    'user_prefs',
    'subscriptions',
    'usage_snapshots',
    'job_scans',
    'request_events'
  )
order by tablename;

-- 2) Inspect effective policies for the public schema.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3) Manual verification checklist (run in the dashboard SQL editor with test users):
--    A. Authenticated as user A:
--       - select/update/delete only rows owned by user A from:
--         applications, messages, profiles, user_prefs, job_scans
--    B. Authenticated as user A against user B row ids:
--       - confirm zero rows returned/affected
--    C. Anonymous:
--       - confirm select/insert/update/delete on user tables fails
--    D. End-user writes blocked:
--       - confirm subscriptions, usage_snapshots, request_events reject insert/update/delete
--    E. Storage:
--       - pair with db/storage_policies.sql and verify avatar writes are restricted to <uid>/...

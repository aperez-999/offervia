-- Offervia / Supabase legacy policy cleanup
-- Run this once on older projects that accumulated duplicate permissive policies,
-- then re-run db/policies.sql to recreate the canonical checked-in policy set.

-- applications
drop policy if exists "apps delete own" on public.applications;
drop policy if exists "apps insert own" on public.applications;
drop policy if exists "apps select own" on public.applications;
drop policy if exists "apps update own" on public.applications;
drop policy if exists "apps_owner" on public.applications;

-- messages
drop policy if exists "delete own messages" on public.messages;
drop policy if exists "insert own messages" on public.messages;
drop policy if exists "messages_insert_self" on public.messages;
drop policy if exists "msgs delete own" on public.messages;
drop policy if exists "msgs insert own" on public.messages;
drop policy if exists "msgs select own" on public.messages;
drop policy if exists "msgs update own" on public.messages;
drop policy if exists "msgs_owner" on public.messages;
drop policy if exists "read own messages" on public.messages;
drop policy if exists "update own messages" on public.messages;

-- profiles
drop policy if exists "profiles_insert_own" on public.profiles;

-- user_prefs
drop policy if exists "delete own prefs" on public.user_prefs;
drop policy if exists "insert own prefs" on public.user_prefs;
drop policy if exists "read own prefs" on public.user_prefs;
drop policy if exists "update own prefs" on public.user_prefs;
drop policy if exists "user_prefs_insert_self" on public.user_prefs;
drop policy if exists "user_prefs_rw" on public.user_prefs;

-- job_scans
drop policy if exists "Users can insert their own scans" on public.job_scans;
drop policy if exists "Users can view their own scans" on public.job_scans;

-- request_events
drop policy if exists "Allow inserts from service role only" on public.request_events;
drop policy if exists "Allow select for service role" on public.request_events;
drop policy if exists "insert own event" on public.request_events;
drop policy if exists "select own events" on public.request_events;

-- prompts
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'prompts'
  ) then
    execute 'drop policy if exists "prompts_owner" on public.prompts';
  end if;
end $$;

-- template_saves
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'template_saves'
  ) then
    execute 'drop policy if exists "Users can delete their saves" on public.template_saves';
    execute 'drop policy if exists "Users can insert their saves" on public.template_saves';
    execute 'drop policy if exists "Users can read their saves" on public.template_saves';
  end if;
end $$;

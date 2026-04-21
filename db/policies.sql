-- Offervia / Supabase Row Level Security policies
-- Apply after schema.sql. Service-role operations (webhooks, metering, etc.) bypass RLS.

-- Helper note:
-- - For client access, we only enable the minimum policies required.
-- - Admin/service code uses SUPABASE_SERVICE_ROLE_KEY and is not constrained by RLS.

-- -------------------------------
-- applications
-- -------------------------------
alter table public.applications enable row level security;

drop policy if exists "applications_select_own" on public.applications;
create policy "applications_select_own"
on public.applications
for select
using (user_id = auth.uid());

drop policy if exists "applications_insert_own" on public.applications;
create policy "applications_insert_own"
on public.applications
for insert
with check (user_id = auth.uid());

drop policy if exists "applications_update_own" on public.applications;
create policy "applications_update_own"
on public.applications
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "applications_delete_own" on public.applications;
create policy "applications_delete_own"
on public.applications
for delete
using (user_id = auth.uid());

-- -------------------------------
-- messages
-- -------------------------------
alter table public.messages enable row level security;

drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own"
on public.messages
for select
using (user_id = auth.uid());

drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own"
on public.messages
for insert
with check (user_id = auth.uid());

drop policy if exists "messages_update_own" on public.messages;
create policy "messages_update_own"
on public.messages
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "messages_delete_own" on public.messages;
create policy "messages_delete_own"
on public.messages
for delete
using (user_id = auth.uid());

-- -------------------------------
-- profiles
-- -------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (id = auth.uid());

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own"
on public.profiles
for insert
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

-- -------------------------------
-- user_prefs
-- -------------------------------
alter table public.user_prefs enable row level security;

drop policy if exists "user_prefs_select_own" on public.user_prefs;
create policy "user_prefs_select_own"
on public.user_prefs
for select
using (user_id = auth.uid());

drop policy if exists "user_prefs_insert_own" on public.user_prefs;
create policy "user_prefs_insert_own"
on public.user_prefs
for insert
with check (user_id = auth.uid());

drop policy if exists "user_prefs_update_own" on public.user_prefs;
create policy "user_prefs_update_own"
on public.user_prefs
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- -------------------------------
-- subscriptions (read-only for end users)
-- -------------------------------
alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
on public.subscriptions
for select
using (user_id = auth.uid());

-- Intentionally no insert/update/delete policies for end users.

-- -------------------------------
-- usage_snapshots (read-only for end users)
-- -------------------------------
alter table public.usage_snapshots enable row level security;

drop policy if exists "usage_snapshots_select_own" on public.usage_snapshots;
create policy "usage_snapshots_select_own"
on public.usage_snapshots
for select
using (user_id = auth.uid());

-- Intentionally no insert/update/delete policies for end users.

-- -------------------------------
-- job_scans (read-only for end users)
-- -------------------------------
alter table public.job_scans enable row level security;

drop policy if exists "job_scans_select_own" on public.job_scans;
create policy "job_scans_select_own"
on public.job_scans
for select
using (user_id = auth.uid());

-- Delete own scan history (UX: allow users to clear their history)
drop policy if exists "job_scans_delete_own" on public.job_scans;
create policy "job_scans_delete_own"
on public.job_scans
for delete
using (user_id = auth.uid());

-- -------------------------------
-- request_events (no user policies; service role only)
-- -------------------------------
alter table public.request_events enable row level security;

-- No policies on purpose.

-- -------------------------------
-- prompts (if present)
-- -------------------------------
-- This repo's code may not currently read/write this table, but older DBs can include it.
-- Keep user ownership tight if it exists.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'prompts'
  ) then
    execute 'alter table public.prompts enable row level security';
    execute 'drop policy if exists "prompts_select_own" on public.prompts';
    execute 'create policy "prompts_select_own" on public.prompts for select using (user_id = auth.uid())';
    execute 'drop policy if exists "prompts_insert_own" on public.prompts';
    execute 'create policy "prompts_insert_own" on public.prompts for insert with check (user_id = auth.uid())';
    execute 'drop policy if exists "prompts_update_own" on public.prompts';
    execute 'create policy "prompts_update_own" on public.prompts for update using (user_id = auth.uid()) with check (user_id = auth.uid())';
    execute 'drop policy if exists "prompts_delete_own" on public.prompts';
    execute 'create policy "prompts_delete_own" on public.prompts for delete using (user_id = auth.uid())';
  end if;
end $$;

-- -------------------------------
-- template_saves (if present)
-- -------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'template_saves'
  ) then
    execute 'alter table public.template_saves enable row level security';
    execute 'drop policy if exists "template_saves_select_own" on public.template_saves';
    execute 'create policy "template_saves_select_own" on public.template_saves for select using (user_id = auth.uid())';
    execute 'drop policy if exists "template_saves_insert_own" on public.template_saves';
    execute 'create policy "template_saves_insert_own" on public.template_saves for insert with check (user_id = auth.uid())';
    execute 'drop policy if exists "template_saves_update_own" on public.template_saves';
    execute 'create policy "template_saves_update_own" on public.template_saves for update using (user_id = auth.uid()) with check (user_id = auth.uid())';
    execute 'drop policy if exists "template_saves_delete_own" on public.template_saves';
    execute 'create policy "template_saves_delete_own" on public.template_saves for delete using (user_id = auth.uid())';
  end if;
end $$;


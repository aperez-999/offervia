-- Production hardening & cleanup (2026-07)
-- Idempotent. Brings a fresh project in line with the live Offervia database
-- after the CRON/email-digest feature removal and the pre-launch security +
-- performance audit. Safe to run multiple times.

-- 1. Drop orphan tables (never referenced by the app; empty).
drop table if exists public.prompts cascade;
drop table if exists public.template_saves cascade;

-- 2. Drop dead preference columns left over from the removed email-digest / cron feature.
alter table public.user_prefs drop column if exists email_digest;
alter table public.user_prefs drop column if exists daily_reminders;
alter table public.profiles   drop column if exists email_digest;

-- 3. Pin a non-mutable search_path on all functions (prevents search_path injection).
alter function public.handle_new_user()             set search_path = public, pg_temp;
alter function public.handle_new_user_profile()      set search_path = public, pg_temp;
alter function public.cleanup_old_request_events()   set search_path = public, pg_temp;
alter function public.set_updated_at()               set search_path = public, pg_temp;

-- 4. Trigger functions must not be directly callable via PostgREST RPC.
revoke execute on function public.handle_new_user()         from anon, authenticated, public;
revoke execute on function public.handle_new_user_profile() from anon, authenticated, public;

-- 5. Move pg_trgm out of the public schema (Supabase best practice; extension is unused by indexes).
create schema if not exists extensions;
alter extension pg_trgm set schema extensions;

-- 6. Consolidate the duplicated `avatars` storage policies down to one per operation.
drop policy if exists "Users can delete their own files 1oj01fe_0" on storage.objects;
drop policy if exists "Users can update their own files 1oj01fe_0" on storage.objects;
drop policy if exists "Users can upload to their own folder 1oj01fe_0" on storage.objects;
drop policy if exists avatars_delete_own        on storage.objects;
drop policy if exists avatars_delete_own_folder on storage.objects;
drop policy if exists avatars_insert_own        on storage.objects;
drop policy if exists avatars_insert_own_folder on storage.objects;
drop policy if exists avatars_public_read       on storage.objects;
drop policy if exists avatars_select_public     on storage.objects;
drop policy if exists avatars_update_own        on storage.objects;
drop policy if exists avatars_update_own_folder on storage.objects;

create policy avatars_public_read on storage.objects
  for select to public using (bucket_id = 'avatars');
create policy avatars_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (auth.uid())::text);
create policy avatars_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (auth.uid())::text);
create policy avatars_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (auth.uid())::text);

-- 7. Drop duplicate indexes (identical partner index is kept).
drop index if exists public.idx_messages_user_id_created;
drop index if exists public.messages_user_mode_created_at_idx;
drop index if exists public.idx_request_events_created_at;
drop index if exists public.user_prefs_user_id_key;
drop index if exists public.user_prefs_user_id_uidx;

-- NOTE: All own-row RLS policies were also rewritten to use `(select auth.uid())`
-- instead of `auth.uid()` so the auth lookup is evaluated once per query rather
-- than once per row. See db/policies.sql for the canonical definitions.

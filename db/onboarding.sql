-- Phase 4: Persisted onboarding state (optional)
-- Apply to your existing Supabase project if you want onboarding checklist state
-- to follow the user across devices/browsers.

alter table public.user_prefs
  add column if not exists onboarding_dismissed boolean not null default false;

alter table public.user_prefs
  add column if not exists onboarding_completed jsonb not null default '{}'::jsonb;


-- Saves the getting-started checklist state so it follows you across devices.
-- Safe to run more than once.

alter table public.user_prefs
  add column if not exists onboarding_dismissed boolean not null default false;

alter table public.user_prefs
  add column if not exists onboarding_completed jsonb not null default '{}'::jsonb;


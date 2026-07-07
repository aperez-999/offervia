-- Daily follow-up reminders opt-in
-- Additive migration: a dedicated flag, separate from the weekly email digest,
-- so users can enable daily follow-up reminder emails on their own.
-- Off by default. Safe to run multiple times.

alter table public.user_prefs
  add column if not exists daily_reminders boolean not null default false;

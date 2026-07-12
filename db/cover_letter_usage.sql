-- Cover Letter usage metering
-- Additive migration: adds a per-month counter for the Cover Letter generator.
-- Safe to run multiple times.

alter table public.usage_snapshots
  add column if not exists cover_letter_count integer not null default 0;

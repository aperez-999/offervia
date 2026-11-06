-- Monthly usage count for cover letters.
-- Safe to run more than once.

alter table public.usage_snapshots
  add column if not exists cover_letter_count integer not null default 0;

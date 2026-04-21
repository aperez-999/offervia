-- Add optional job scan context fields (idempotent)
-- This enables a better Tier B experience: cross-device scan history with “Load” and “Continue” actions.

alter table public.job_scans
  add column if not exists jd_excerpt text;

alter table public.job_scans
  add column if not exists title text;


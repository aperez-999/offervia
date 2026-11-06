-- Keeps a short excerpt of each scanned job description for scan history.
-- Safe to run more than once.

alter table public.job_scans
  add column if not exists jd_excerpt text;

alter table public.job_scans
  add column if not exists title text;


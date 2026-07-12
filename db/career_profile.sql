-- Career profile enrichment
-- Adds structured career fields to profiles so every AI feature (scanner,
-- resume, interview, coach) can personalize output without re-asking the user.
-- Additive and safe: existing rows keep NULLs, existing features are unaffected.

alter table public.profiles
  add column if not exists headline text,
  add column if not exists target_role text,
  add column if not exists seniority text,          -- intern | junior | mid | senior | lead | manager
  add column if not exists key_skills text,          -- comma-separated
  add column if not exists locations text,
  add column if not exists work_pref text,            -- remote | hybrid | onsite | flexible
  add column if not exists years_experience integer,
  add column if not exists bio text;

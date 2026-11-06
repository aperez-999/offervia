-- Career details on the profile (target role, skills, and so on), used to
-- personalize the tools. Safe to run more than once.

alter table public.profiles
  add column if not exists headline text,
  add column if not exists target_role text,
  add column if not exists seniority text,          -- intern | junior | mid | senior | lead | manager
  add column if not exists key_skills text,          -- comma-separated
  add column if not exists locations text,
  add column if not exists work_pref text,            -- remote | hybrid | onsite | flexible
  add column if not exists years_experience integer,
  add column if not exists bio text;

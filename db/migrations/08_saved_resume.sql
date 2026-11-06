-- My resume: one saved resume per account, used to pre-fill the tools. The
-- existing profiles policies already cover these columns. Safe to run more than once.

alter table public.profiles
  add column if not exists resume_text text,
  add column if not exists resume_updated_at timestamptz;

alter table public.profiles drop constraint if exists profiles_resume_text_len;
alter table public.profiles
  add constraint profiles_resume_text_len check (resume_text is null or char_length(resume_text) <= 30000);

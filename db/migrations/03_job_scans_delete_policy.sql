-- Lets people delete their own scan history.
-- Safe to run more than once.

alter table public.job_scans enable row level security;

drop policy if exists "job_scans_delete_own" on public.job_scans;
create policy "job_scans_delete_own"
on public.job_scans
for delete
using (user_id = auth.uid());


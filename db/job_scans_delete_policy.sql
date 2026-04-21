-- Allow users to delete their own job scan history (idempotent)
-- This enables “Delete cloud history” in the UI while keeping access scoped to auth.uid().

alter table public.job_scans enable row level security;

drop policy if exists "job_scans_delete_own" on public.job_scans;
create policy "job_scans_delete_own"
on public.job_scans
for delete
using (user_id = auth.uid());


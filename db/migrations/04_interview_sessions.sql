-- Mock interview sessions and their monthly usage count.
-- Safe to run more than once.

alter table public.usage_snapshots
  add column if not exists interview_session_count integer not null default 0;

-- Interview sessions.
create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role_title text not null,
  focus text not null,          -- behavioral | technical | mixed
  difficulty text not null,     -- intro | standard | senior
  questions jsonb not null default '[]'::jsonb,   -- string[]
  transcript jsonb not null default '[]'::jsonb,  -- [{question, answer, score, strengths[], improvements[], tip}]
  overall_score integer,
  summary text,
  status text not null default 'active',          -- active | completed
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists interview_sessions_user_created_idx
  on public.interview_sessions (user_id, created_at desc);

-- Row level security. The API uses the service role, so this is a second line of defense.
alter table public.interview_sessions enable row level security;

drop policy if exists "interview_sessions_select_own" on public.interview_sessions;
create policy "interview_sessions_select_own"
on public.interview_sessions
for select
using (user_id = auth.uid());

drop policy if exists "interview_sessions_insert_own" on public.interview_sessions;
create policy "interview_sessions_insert_own"
on public.interview_sessions
for insert
with check (user_id = auth.uid());

drop policy if exists "interview_sessions_update_own" on public.interview_sessions;
create policy "interview_sessions_update_own"
on public.interview_sessions
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "interview_sessions_delete_own" on public.interview_sessions;
create policy "interview_sessions_delete_own"
on public.interview_sessions
for delete
using (user_id = auth.uid());

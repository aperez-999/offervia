-- Offervia / Supabase schema
-- Apply in Supabase SQL editor (or via migrations) in a fresh project.

-- UUID generation
create extension if not exists "pgcrypto";

-- -------------------------------
-- Core: Job applications tracker
-- -------------------------------
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company text not null,
  position text not null,
  source text,
  resume_used text,
  status text not null,
  applied_on date,
  follow_up_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists applications_user_id_idx on public.applications (user_id);
create index if not exists applications_created_at_idx on public.applications (created_at desc);

-- -------------------------------
-- AI Coach: chat message history
-- -------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mode text not null, -- interview|resume|cover_letter|career
  role text not null, -- system|user|assistant
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_user_id_mode_created_at_idx
  on public.messages (user_id, mode, created_at asc);

-- -------------------------------
-- Plans / Billing
-- -------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan text not null default 'free', -- free|pro
  status text not null default 'inactive',
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);

-- -------------------------------
-- Usage metering (monthly)
-- -------------------------------
create table if not exists public.usage_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  month text not null, -- YYYY-MM
  resume_tailor_count integer not null default 0,
  coach_message_count integer not null default 0,
  job_scan_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

create index if not exists usage_snapshots_user_id_month_idx on public.usage_snapshots (user_id, month);

-- -------------------------------
-- Job scan history (optional analytics)
-- -------------------------------
create table if not exists public.job_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  jd_excerpt text,
  title text,
  match_score integer not null,
  strengths jsonb not null default '[]'::jsonb,
  missing_skills jsonb not null default '[]'::jsonb,
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists job_scans_user_id_created_at_idx on public.job_scans (user_id, created_at asc);

-- -------------------------------
-- Profile + preferences
-- -------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_prefs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  default_mode text,
  weekly_goal integer,
  email_digest boolean not null default false,
  onboarding_dismissed boolean not null default false,
  onboarding_completed jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- -------------------------------
-- Request events (rate limiting)
-- -------------------------------
create table if not exists public.request_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null,
  ip text,
  ua text,
  created_at timestamptz not null default now()
);

create index if not exists request_events_kind_created_at_idx on public.request_events (kind, created_at desc);
create index if not exists request_events_user_kind_created_at_idx on public.request_events (user_id, kind, created_at desc);

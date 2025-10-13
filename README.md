0) Elevator pitch

Offervia — Your AI co-pilot from application to offer.
A student-friendly web app that helps students and early professionals tailor resumes to job descriptions, scan JDs for keywords, prep interviews with an AI coach, and track applications in a clean dashboard — all on a free stack (Groq + Supabase + Next.js + Vercel).

1) Core features (MVP)

	•	Resume Tailor: paste a JD → generate tailored bullets/summary + ATS keyword match.
	•	JD Scanner: highlights required skills, missing keywords, seniority, location, visa hints.
	•	AI Career Coach: chat mode for behavioral/technical Q&A, STAR structuring.
	•	Job Tracker: CRUD table with status (Applied / Interviewing / Take-Home / Offer / Rejected), follow-up date, notes.
	•	Insights (v1.1): weekly recap (“You applied to 12 roles; follow up on 4.”).

2) Tech stack (free tiers only)

	•	Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui.
	•	Auth + DB: Supabase (Auth, Postgres, Row Level Security).
	•	AI: Groq API (e.g., llama-3.1-70b-versatile) — no paid keys.
	•	Deployment: Vercel.
	•	Form/State: React Hook Form + Zod.
	•	Analytics (optional): PostHog free plan.
	•	Lint/Format: ESLint + Prettier + Husky (pre-commit).

3) High-level architecture

Next.js (app/)
  ├─ Public routes: landing (/) + auth (/login, /signup)
  ├─ Protected routes: /dashboard, /tracker, /coach, /resume
API routes (app/api/*) server actions & edge handlers
Supabase: auth, tables (applications, prompts, messages)
Groq: server-side calls only (no API key in client)

4) Recommended file structure

offervia/
├─ app/
│  ├─ (public)/
│  │  ├─ page.tsx                     # Landing
│  │  └─ pricing/page.tsx             # (future)
│  ├─ (auth)/
│  │  ├─ login/page.tsx
│  │  └─ signup/page.tsx
│  ├─ (protected)/
│  │  ├─ dashboard/page.tsx
│  │  ├─ resume/page.tsx              # Resume Tailor
│  │  ├─ scanner/page.tsx             # JD Scanner
│  │  ├─ coach/page.tsx               # AI Coach chat
│  │  └─ tracker/page.tsx             # Job Tracker
│  ├─ api/
│  │  ├─ ai/tailor/route.ts           # POST -> tailored bullets/summary
│  │  ├─ ai/scan/route.ts             # POST -> JD keyword extraction
│  │  ├─ ai/coach/route.ts            # POST -> chat turns
│  │  └─ tracker/route.ts             # GET/POST/PATCH/DELETE (REST-ish)
│  └─ layout.tsx
├─ components/
│  ├─ ui/*                            # shadcn
│  ├─ navbar.tsx, sidebar.tsx
│  ├─ forms/*
│  ├─ charts/*
│  └─ table/*
├─ lib/
│  ├─ supabase/server.ts              # server client
│  ├─ supabase/client.ts              # browser client (protected pages)
│  ├─ auth.ts                         # middleware helpers
│  ├─ groq.ts                         # Groq fetch wrapper
│  └─ prompts.ts                      # system prompts for AI
├─ db/
│  ├─ schema.sql                      # Supabase SQL
│  └─ policies.sql                    # RLS policies
├─ styles/
│  └─ globals.css
├─ .env.example
├─ package.json
├─ README.md
└─ LICENSE

5) Database schema (Supabase SQL)

-- Users via auth.users

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  role text not null,
  source text check (source in ('LinkedIn','Handshake','Indeed','Company','Other')) default 'Other',
  resume_used text check (resume_used in ('Frontend','Full-Stack','AI','General')) default 'Full-Stack',
  status text check (status in ('Applied','Interviewing','Assessment','Offer','Rejected')) default 'Applied',
  date_applied date default now(),
  follow_up_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text check (role in ('system','user','assistant')) not null,
  content text not null,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text check (kind in ('tailor','scan','coach')) not null,
  system_prompt text not null,
  created_at timestamptz default now()
);

-- RLS
alter table public.applications enable row level security;
alter table public.messages enable row level security;
alter table public.prompts enable row level security;

create policy "apps_owner" on public.applications
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "msgs_owner" on public.messages
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "prompts_owner" on public.prompts
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

6) API spec (minimal)

	•	POST /api/ai/tailor
Body: { resumeBullets: string[], jobDescription: string }
Resp: { tailoredBullets: string[], summary: string, keywords: string[] }
	•	POST /api/ai/scan
Body: { jobDescription: string }
Resp: { requiredSkills: string[], missingFromResume: string[], level: 'intern'|'newgrad'|'other' }
	•	POST /api/ai/coach
Body: { messages: {role:'user'|'assistant'|'system', content:string}[] }
Resp: { messages: [...], suggestions?: string[] }
	•	GET /api/tracker → list user applications
	•	POST /api/tracker → create application
	•	PATCH /api/tracker?id=... → update fields
	•	DELETE /api/tracker?id=... → delete

All API routes: server-only; validate input with Zod; require Supabase auth session.

7) Environment variables (.env.local)

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # only on server (Vercel env), not exposed
GROQ_API_KEY=
NEXT_PUBLIC_APP_NAME=Offervia

8) System prompts (guardrails—non-hallucination)

	•	Tailor (system): “You rewrite bullets concisely with measurable impact, only using details present in the user’s original bullet or the provided job description. Do not invent tools, companies, or metrics. Prefer active verbs; 1 line each; include role-relevant keywords exactly as in the JD.”
	•	Scan (system): “Extract keywords/skills from the JD; return arrays only. Do not add technologies not present unless they are obvious synonyms (e.g., JavaScript ↔ JS).”
	•	Coach (system): “Interview coach for students/early professionals. Use STAR. Keep answers under 120 words unless asked. No confidential or private info. If unsure, ask a clarifying question.”

9) Setup — local

# 1) create app
npx create-next-app@latest offervia --ts --eslint --tailwind --app

# 2) install deps
cd offervia
pnpm add @supabase/supabase-js zod react-hook-form @tanstack/react-table
pnpm add -D @types/node @types/react @types/react-dom husky lint-staged

# 3) shadcn
pnpm dlx shadcn-ui@latest init
pnpm dlx shadcn-ui@latest add button input textarea card table alert dialog

# 4) env
cp .env.example .env.local  # fill with Supabase + Groq keys

# 5) db: create tables (Supabase SQL editor) using /db/schema.sql + policies.sql

# 6) run
pnpm dev

10) Deployment — Vercel
	•	Connect GitHub repo, set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, GROQ_API_KEY in Vercel project settings.
	•	Protect /dashboard et al. with server-side session check (redirect to /login if not signed in).

11) Pages to implement (MVP)
	•	/ Landing: hero “From application to offer”, CTA → Sign up.
	•	/dashboard: quick actions (Tailor, Scan, Coach, Tracker); weekly summary.
	•	/resume: textarea JD + bullets list → “Tailor” results side-by-side diff + copy buttons.
	•	/scanner: paste JD → keyword chips, “missing skills”.
	•	/coach: chat with prebuilt prompts (Behavioral, Frontend, Backend, System Design).
	•	/tracker: table with filters, inline edit; add application modal.

12) Acceptance criteria (MVP is “done” when…)
	•	Auth works; protected pages redirect unauth’d users.
	•	Tailor returns 3–6 concise bullets + summary section; no hallucinated tech.
	•	Scanner returns arrays with 90%+ precision on obvious keywords.
	•	Coach answers in STAR under 120 words by default.
	•	Tracker supports full CRUD, filtered by user_id via RLS.
	•	CI passes: typecheck, lint, build.

⸻

13) License

MIT — © 2025 PerezDev (Alejandro Perez-Rivero)

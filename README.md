# Offervia

Live demo: [offervia.vercel.app](https://offervia.vercel.app)

Offervia is a job search helper for students, new grads, and anyone applying to roles. Paste a posting and it checks that posting against your resume, rewrites the resume, drafts a cover letter, lets you practice interview answers, and keeps a tracker of where you applied. Student Hub is a short list of templates, links, and student discounts.

![Offervia](public/og-image.png)

## What I built

- Authenticated Next.js app with email and OAuth sign-in, protected routes, and row-level security in Postgres
- Server routes that send a resume and a job description to an LLM and return a rewritten resume, a cover letter, a keyword match, or interview feedback
- Monthly usage limits, with Stripe Checkout and a billing portal for the higher tier
- An application tracker with follow-up dates and CSV export
- File upload that reads PDF and DOCX resumes on the server

## Stack

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS
- Supabase (auth, Postgres, storage)
- Groq for generation
- Stripe for subscriptions
- Deployed on Vercel

## Features

- Resume Tailor: resume plus a job description, rewritten for that role
- Job scanner: keywords the posting asks for, and which ones the resume is missing
- Interview coach and mock interview: practice answers with notes
- Cover letters: a draft from the same posting and resume
- Job tracker: status, follow-ups, and CSV export
- Account, profile, and billing

## Project structure
- `app/`: App Router pages, layouts, and API routes
- `components/`: Feature components and shared UI
- `lib/`: Environment, API helpers, Supabase clients, plans, usage, and service integrations
- `db/`: Checked-in SQL schema, policies, and incremental migration scripts
- `public/`: Static assets

## Database Setup
For a new Supabase project:

```bash
# Run these in the Supabase SQL editor
db/schema.sql
db/policies.sql
db/storage_policies.sql
```

For an existing project that predates persisted onboarding fields:

```bash
db/onboarding.sql
```

For existing projects, apply these additive feature migrations (safe to re-run):

```bash
db/interview_sessions.sql      # interview_session_count usage column
db/cover_letter_usage.sql      # cover_letter_count usage column
db/career_profile.sql          # career profile fields
db/daily_reminders_pref.sql    # daily follow-up reminder opt-in
db/documents.sql               # saved cover letters & resumes history
```

Before release, also review:

```bash
db/audit/rls-verification.sql
```

If your project has older duplicate policies from previous iterations, run this upgrade sequence before release:

```bash
db/policy_cleanup.sql
db/policies.sql
db/audit/rls-verification.sql
```

## API routes

- `POST /api/resume-tailor`
- `POST /api/cover-letter`
- `POST /api/job-scan`
- `POST /api/coach`
- `GET|POST|PATCH|DELETE /api/tracker`
- `POST /api/create-checkout-session`
- `POST /api/create-portal-session`
- `POST /api/stripe-webhook`
- `POST /api/contact`

## Run it locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill in `.env.local` from `.env.example`. The names there are the full list, including Supabase, Groq, Stripe, email, and Sentry. Sentry can stay blank in local development.

```bash
npm run lint
npm run build
npm run test
```

`npm run test:unit` runs Vitest. `npm run test:e2e` runs Playwright. Authenticated Playwright tests need `E2E_EMAIL` and `E2E_PASSWORD`. If `E2E_BASE_URL` is set, Playwright uses that URL and expects the app to already be running. If it is omitted, Playwright starts a local server.

## Secrets

Do not commit `.env`, `.env.local`, or any other env file. `.env.example` is the only one that belongs in git, and it has empty values.

Anything that can read or change other people's data stays on the server: `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, SMTP passwords, and `SENTRY_AUTH_TOKEN`. The anon Supabase key and the Stripe price id are safe to expose in the browser. They are still not hardcoded in the repo.

Resume text, job descriptions, and chat messages are sent from the server to Groq to produce a draft. The app stores the account, tracker rows, coach messages, scans, and monthly usage so those screens still work the next time you sign in.

## Deploy

The live site is on Vercel. Set the same variables there, with `NEXT_PUBLIC_SITE_URL` set to the public URL. Before a release, run lint, the production build, and tests, then walk through [docs/release-checklist.md](docs/release-checklist.md) and [docs/security-checklist.md](docs/security-checklist.md).

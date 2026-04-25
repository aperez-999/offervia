# Offervia

Offervia is an AI-assisted job search app for job seekers, students, and early-career professionals. It helps users scan job descriptions, tailor resumes, chat with an interview coach, track applications, and manage usage and billing in one place.

## Core Features
- `Resume Tailor`: Submit resume content plus a target job description and generate a tailored rewrite.
- `Job Scanner`: Analyze a JD for strengths, missing skills, and a match score.
- `AI Coach`: Persisted chat modes for interview, resume, cover letter, and career guidance.
- `Job Tracker`: CRUD interface for applications with filters, exports, and follow-up tracking.
- `Account & Billing`: Supabase auth, profile/settings, Stripe checkout, and portal access.

## Tech Stack
- `Next.js 15` App Router + `React 19` + `TypeScript`
- `Tailwind CSS` + `shadcn/ui` primitives
- `Supabase` for auth, Postgres, RLS, storage, and service-role admin tasks
- `Groq` for AI generation
- `Stripe` for subscriptions
- `Nodemailer` for contact mail and weekly digest emails

## Project Structure
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

Before release, also review:

```bash
db/audit/rls-verification.sql
```

## API Routes
- `POST /api/resume-tailor`
- `POST /api/job-scan`
- `POST /api/coach`
- `GET|POST|PATCH|DELETE /api/tracker`
- `POST /api/create-checkout-session`
- `POST /api/create-portal-session`
- `POST /api/stripe-webhook`
- `POST /api/contact`
- `POST /api/cron/weekly-digest`

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_STRIPE_PRICE_ID`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `CONTACT_TO`
- `CONTACT_FROM`
- `CONTACT_FROM_NAME`
- `CONTACT_FROM_EMAIL`
- `CRON_SECRET`

## Local Development
```bash
npm install
cp .env.example .env.local
npm run dev
```

Quality checks:

```bash
npm run lint
npm run build
npm run test
```

## Testing
- `npm run test:unit`: runs Vitest unit/component tests
- `npm run test:e2e`: runs Playwright smoke tests
- `npm run test`: runs both

Authenticated Playwright smoke coverage is optional and enabled by setting:
- `E2E_EMAIL`
- `E2E_PASSWORD`
- `E2E_BASE_URL` (optional; defaults to local dev server)

## Release Flow
For the current solo workflow:

1. Run `npm run lint`
2. Run `npm run build`
3. Run `npm run test`
4. Deploy to Vercel
5. Confirm the production build succeeds
6. Run the post-deploy checks in [docs/release-checklist.md](docs/release-checklist.md)
7. Run the security checks in [docs/security-checklist.md](docs/security-checklist.md)

## Notes on Data Handling
User-submitted resume text, job descriptions, and chat prompts are sent through Offervia’s server-side routes to configured AI providers so the app can generate outputs. The app also stores feature history such as tracker entries, chat messages, usage counters, and job scans where needed to provide the user experience.

## Sentry Setup
Sentry is optional in local development and recommended in production.

Environment variables:
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN` (optional; recommended when uploading source maps)

Set these in `.env.local` for local testing and in Vercel project settings for production and preview deployments.

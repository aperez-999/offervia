# Changelog

All notable changes to Offervia are documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/),
and this project uses informal semantic-style versioning.

## [2.2.0] — 2026-07-08

Feature release. Non-breaking; all database changes are additive.

### Added

- **Interview Prep** — interactive, role-aware text mock interviews powered by
  Groq. Questions adapt to the target role (not hard-coded), with per-plan usage
  metering and an interview history view.
- **Cover Letter Studio** — generate tailored cover letters from a pasted resume
  or an uploaded PDF/DOCX, with company/role targeting and usage metering.
- **Saved Documents** — cover letters and tailored resumes are saved to a history
  you can revisit, copy, and export.
- **In-app PDF export** — dependency-free print-to-PDF for generated documents.
- **Application workspace** (`/tracker/[id]`) — a per-job hub to edit company,
  position, status, applied/follow-up dates, and notes; view related saved
  documents and the best job-scan match; and deep-link into the resume, cover
  letter, and scanner tools with role/company prefilled.
- **Student Hub** — templates, resources, and student deals consolidated into one
  organized section with a proper loading state.
- **Career profile personalization** — target role, seniority, skills, and
  locations feed into the AI coach, resume, and cover-letter prompts.
- **Skill-gap insights** — recurring missing skills surfaced on the dashboard.
- **Daily follow-up reminders** — opt-in in-app panel plus reminder cron, built on
  existing application dates and the digest infrastructure.

### Changed

- Shared resume file parsing (`lib/files/extract.ts`) and print-to-PDF
  (`lib/print-pdf.ts`) helpers extracted and reused to remove duplication.
- Groq client now uses a 30s timeout and automatic retries across all LLM routes,
  reducing hangs and transient rate-limit failures.
- Version bumped to 2.2.0.

### Fixed

- Follow-up cron queried a non-existent `applications.role` column (live schema
  uses `position`), which silently prevented reminders from being sent.
- Light-mode navbar logo flashed white on refresh before loading.

### Security

- AI coach now filters out non-user/assistant roles from client-supplied message
  history, closing a prompt-injection vector via injected `system` messages.
- Removed dead/unused Supabase client helper.
- Verified row-level security across all live tables (anonymous reads return no
  rows while service-role reads succeed).

### Deployment notes

- Set `CRON_SECRET` in the hosting environment and wire the scheduler; the
  follow-up reminders and weekly digest fail closed until this is configured.
- Confirm production environment variables (Stripe live keys, Groq, SMTP, Sentry,
  Supabase) before release.

## [2.1.0]

- Prior release (baseline before this changelog was introduced).

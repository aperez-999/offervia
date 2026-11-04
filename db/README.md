# Database

Supabase holds auth, Postgres, and row level security. The SQL in this folder is what the app expects.

## Files

- `schema.sql`: tables
- `policies.sql`: row level security
- `policy_cleanup.sql`: drops older duplicate policies before you reapply `policies.sql`
- `storage_policies.sql`: avatar bucket
- `audit/rls-verification.sql`: queries to check the live policies
- `onboarding.sql`, `interview_sessions.sql`, `cover_letter_usage.sql`, `career_profile.sql`, `daily_reminders_pref.sql`, `documents.sql`: later columns, safe to run more than once

## New project

In the Supabase SQL editor, run `schema.sql`, then `policies.sql`, then `storage_policies.sql`.

## Existing project

Run any migration file you have not applied yet. If `pg_policies` shows duplicate policies from older versions, run `policy_cleanup.sql`, then `policies.sql`, then `audit/rls-verification.sql`.

## What the tables are for

- `applications`: tracker rows, one user each
- `messages`: coach chat history
- `profiles`: name and avatar, copied from auth
- `user_prefs`: weekly goal, coach mode, reminder opt-in
- `job_scans`: saved scans
- `usage_snapshots`: monthly counts for the free and Pro limits
- `subscriptions`: Stripe plan state
- `request_events`: rate limit log, server only

Users can read and write their own rows on `applications`, `messages`, `profiles`, and `user_prefs`. They can read their own rows on `subscriptions`, `usage_snapshots`, and `job_scans`. Writes to those three, and all access to `request_events`, go through the service role on the server.

# Database

Offervia uses Supabase for sign-in, Postgres, and file storage. Everything the app expects is in this folder. Every file is safe to run more than once.

## Setting up a new project

In the Supabase SQL editor, run these in order:

1. `schema.sql` creates the tables.
2. `policies.sql` adds row level security, so people can only see their own data.
3. `storage_policies.sql` creates the `avatars` bucket for profile photos.
4. Every file in `migrations/`, in number order.

## Updating an existing project

Run any file in `migrations/` you haven't run yet. Running one twice does no harm.

To check your security rules afterwards, run the queries in `audit/rls-verification.sql`.

## What each table holds

| Table | What's in it | Who can write it |
|---|---|---|
| `profiles` | Name, photo, career details, and My resume | The user |
| `user_prefs` | Weekly goal, coach mode, checklist progress | The user |
| `applications` | Tracker rows | The user |
| `messages` | Coach chat history | The user |
| `job_scans` | Saved keyword scans | Server only (users can read and delete) |
| `documents` | Saved resumes and cover letters | The user (add, read, delete) |
| `interview_sessions` | Mock interviews and their feedback | The user |
| `usage_snapshots` | Monthly usage counts shown as stats | Server only (users can read) |
| `request_events` | Rate limit log and daily usage limits | Server only |

"Server only" means the app writes it through the service role key, which never reaches the browser. Every table is tied to the user's account and is removed automatically when the account is deleted. The one exception is `request_events`, which the delete account route clears itself.

Older databases may also have a `subscriptions` table. The app doesn't use it, so you can drop it.

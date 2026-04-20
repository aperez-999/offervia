# Supabase Database Reference

Offervia uses Supabase for **Auth + Postgres + Row Level Security (RLS)**.

## Source of truth
- **Schema**: `db/schema.sql`
- **RLS policies**: `db/policies.sql`

These files are intended to be **kept in the repo** (they’re your reproducible “database as code” baseline).

## How to apply (new Supabase project)
1. Open **Supabase Dashboard → SQL Editor**.
2. Run `db/schema.sql`
3. Run `db/policies.sql`

## Tables used by this repo
- **`applications`**: job application tracker items (per-user)
- **`messages`**: AI coach chat history (per-user)
- **`profiles`**: profile fields mirrored from auth metadata (per-user)
- **`user_prefs`**: settings (default coach mode, weekly goal, email digest)
- **`job_scans`**: job scan results history (optional analytics)
- **`usage_snapshots`**: monthly usage counters (for plan limits)
- **`subscriptions`**: Stripe subscription state (plan/status/period end)
- **`request_events`**: rate limiting events (server/service only)

## RLS policy intent (high level)
- **User-owned tables** (`applications`, `messages`, `profiles`, `user_prefs`):
  - Users can **select/insert/update/delete only their own rows** via `auth.uid()`.
- **Read-only-to-user tables** (`subscriptions`, `usage_snapshots`, `job_scans`):
  - Users can **select only their own rows**.
  - Inserts/updates are performed by backend code (service role) and/or webhooks.
- **Server-only table** (`request_events`):
  - **No user policies** by design; rate limiting uses service role.

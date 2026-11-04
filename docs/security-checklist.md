# Security checklist

Use this before a production deploy, and again before making the repo public.

## Secrets

- `.env.local` is not staged. `git status` should not list it.
- No key, webhook secret, or service-role JWT is hardcoded in the repo or in git history.
- `SUPABASE_SERVICE_ROLE_KEY` is only set as a server variable. It is not prefixed with `NEXT_PUBLIC_`.
- Vercel only has the variables this app actually reads.

## Auth and data

- Protected routes call `getUser()`, not `getSession()`.
- The OAuth callback only redirects to a path inside this site.
- Login, signup, and password reset are rate limited.
- Auth screens show a short message, not the raw provider error.
- `db/policies.sql` and `db/storage_policies.sql` match what is applied in Supabase.
- `db/audit/rls-verification.sql` has been run against the live database.

## Billing

- The Stripe webhook rejects a request with a bad signature.
- Checkout and the billing portal require a signed-in user.

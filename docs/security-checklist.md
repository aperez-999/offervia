# Offervia Security Release Checklist

## Auth and session
- Middleware uses verified user checks, not `getSession()` for protected-route enforcement.
- OAuth callback is server-side and only redirects to sanitized internal paths.
- Password login, signup, and forgot-password flows are rate-limited.
- Client auth screens never display raw provider or backend error text.

## Supabase and data access
- `db/policy_cleanup.sql` applied if the project previously accumulated duplicate legacy policies.
- `db/policies.sql` applied in production.
- `db/storage_policies.sql` applied for the `avatars` bucket.
- `db/audit/rls-verification.sql` reviewed against live production/preview data.
- No public environment variable contains `SUPABASE_SERVICE_ROLE_KEY` or other server-only secrets.

## Billing and integrations
- Stripe webhook signature verification tested with an invalid signature.
- Billing portal and checkout routes require authenticated users and rate-limit correctly.
- Sentry receives one production test event after deploy.

## Security hygiene
- Repo secret scan completed.
- Vercel environment variables reviewed and trimmed to required values only.
- `npm audit --omit=dev` run with network access and findings triaged.
- No temporary dev-only test surfaces remain exposed before launch.

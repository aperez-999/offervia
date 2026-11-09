# Release checklist

## Before you deploy

- `npm run lint`, `npm run test`, and `npm run build` all pass.
- Every file in `db/migrations/` has been run on the production database.
- Vercel has the variables from `.env.example`, with `NEXT_PUBLIC_SITE_URL` set to the public URL.
- `SUPABASE_SERVICE_ROLE_KEY` is not prefixed with `NEXT_PUBLIC_`, and no key is committed anywhere in the repo or its history.
- `git status` doesn't list `.env.local`.

## After you deploy

- The home page, sign in, and sign up load.
- After signing in, each sidebar section opens.
- Saving My resume on Profile pre-fills the keyword scan.
- `npm run check:links` reports no broken Student Hub links.
- If Sentry is set up, a test error shows up there.

## Security, once in a while

- Run `db/audit/rls-verification.sql` against the live database and check that each table's policies match `db/policies.sql`, `db/storage_policies.sql`, and the migrations.
- Signed-out requests to the API routes get a 401.
- Sign in, sign up, and password reset are rate limited.
- Sign-in redirects only go to paths inside the site.
- Every tool that calls Groq checks the daily limit first, and records a use only after it succeeds.

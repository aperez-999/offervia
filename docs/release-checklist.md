# Offervia Release Checklist

## Local checks
- `npm run lint`
- `npm run build`
- `npm run test`

## Environment checks
- Production Sentry variables are set in Vercel
- Preview Sentry variables are set in Vercel if preview monitoring is desired
- Billing and auth environment variables are still present and valid

## Deploy checks
- Vercel production deployment succeeds
- No build-time TypeScript or lint failures appear in the deploy logs

## Post-deploy smoke
- Homepage loads
- Login works
- Dashboard loads
- Job Packet opens
- Resume, Scanner, Tracker, and Coach routes load
- Upgrade page loads

## Monitoring checks
- Trigger one handled test error and confirm it appears in Sentry
- Verify no unexpected spike of route or API errors after deploy

## Dashboard review
- The continuation card is the clearest action on the page
- Progress cards are readable on desktop and mobile
- Onboarding does not dominate the page for returning users
- Pro insights remain available but visually secondary

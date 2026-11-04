# Release checklist

## Before deploy

- `npm run lint`
- `npm run build`
- `npm run test`
- Production env vars are set in Vercel, including `NEXT_PUBLIC_SITE_URL`

## After deploy

- Homepage loads
- Sign-in works
- Dashboard, Job Packet, Resume, Scanner, Tracker, and Coach open
- The upgrade page opens
- A handled error shows up in Sentry, if Sentry is configured

# Offervia

A free job search tool for students, new grads, and anyone applying for jobs. Paste a job posting, see what your resume is missing, and fix it before you apply.

**Try it:** [offervia.vercel.app](https://offervia.vercel.app)

![Offervia](public/og-image.png)

## What you can do

- **Start a new application.** Paste a posting, check it against your resume, update your resume for that job, and add it to your tracker.
- **Work on your resume and letters.** Tailor your resume to a job, scan a posting for keywords, tighten your bullet points, and write cover letters.
- **Prepare for interviews.** Run a mock interview with a score and notes on each answer, or ask the coach a quick question.
- **Keep track.** See every application, when to follow up, and compare offers side by side.
- **Use the Student Hub.** Email templates, student discounts, and free places to learn.

Save your resume once on your profile and every tool starts from it.

## Run it yourself

You'll need Node 20 or newer, a free [Supabase](https://supabase.com) project, and a free [Groq](https://console.groq.com/keys) API key.

1. Install and copy the example settings:

   ```bash
   npm install
   cp .env.example .env.local
   ```

2. Fill in the four required values at the top of `.env.local`. Everything else is optional.

3. Set up the database. In the Supabase SQL editor, run `db/schema.sql`, `db/policies.sql`, `db/storage_policies.sql`, then each file in `db/migrations/` in number order. [db/README.md](db/README.md) has the details.

4. Start the app:

   ```bash
   npm run dev
   ```

   Open [localhost:3000](http://localhost:3000) and make an account.

## Checks

```bash
npm run lint          # code style
npm run test:unit     # unit tests (Vitest)
npm run test:e2e      # browser tests (Playwright)
npm run build         # production build
npm run check:links   # checks every Student Hub link
```

The signed-in browser tests use a real account. Put its email and password in `E2E_EMAIL` and `E2E_PASSWORD`.

## How it's built

Next.js 15 and React 19 with TypeScript, styled with Tailwind CSS 4. Supabase handles sign-in, the database, and file storage. Groq writes the resume, cover letter, interview, and coach responses. The site runs on Vercel.

| Folder | What's in it |
|---|---|
| `app/` | Pages and API routes |
| `components/` | UI, grouped by feature |
| `lib/` | Shared logic: database clients, usage limits, the bullet checker, and offer math |
| `content/student-hub/` | Templates, deals, and resources shown in the Student Hub |
| `db/` | Database setup and migrations |
| `e2e/` | Browser tests |

`DESIGN.md` describes the colors, type, and components. `PRODUCT.md` covers who the app is for and the principles behind it.

## Daily limits

Every tool that calls Groq has a per-person limit that resets on a rolling 24 hours, so one person can't use up a shared key. Requests that fail don't count. Change the numbers in [`lib/usage/limits.ts`](lib/usage/limits.ts).

| Tool | Per day |
|---|---|
| Job scans | 25 |
| Resume tailoring | 8 |
| Cover letters | 8 |
| Mock interviews | 5 |
| Coach messages | 40 |

## Your data

The app stores your account and what you save so it's there next time. Resume text, job descriptions, and messages are sent to Groq to write responses. The bullet checker and offer comparison run entirely in your browser. Anyone can export or delete their own data from Settings. The [privacy page](https://offervia.vercel.app/privacy) has the details.

Keep `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, and `SENTRY_AUTH_TOKEN` on the server, and never commit `.env.local`.

## Contributing

Questions and ideas go in [Discussions](https://github.com/aperez-999/offervia/discussions). Bugs go in [Issues](https://github.com/aperez-999/offervia/issues).

The easiest way to help is to suggest a resource or student deal. Use the link at the bottom of the Student Hub, or edit the files in `content/student-hub/` and open a pull request. Link to the official page, not an affiliate link, and run `npm run check:links` first.

For code changes, run `npm run lint`, `npm run test:unit`, and `npm run build` before you open a pull request.

## Deploying

The live site runs on Vercel. Add the same variables from `.env.local` in your Vercel project settings, and set `NEXT_PUBLIC_SITE_URL` to your public URL. [docs/release-checklist.md](docs/release-checklist.md) lists what to check before and after a release.

## License

[MIT](LICENSE). You can use, copy, and change the code, as long as you keep the copyright notice.

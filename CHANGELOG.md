# Changelog

Notable changes to Offervia. Versions follow [semantic versioning](https://semver.org/).

## [2.3.0] (unreleased)

First public release.

### Added

- **Bullet checker** (`/bullet-check`). Checks resume bullets as you type for weak openers, missing numbers, first person, filler, length, and tense.
- **Offer compare** (`/offers`). Two or three offers side by side: first-year pay, pay after rent, commute hours, and real hourly pay.
- **My resume.** Save your resume once on your profile; the keyword scan, resume tailor, and cover letter start from it. Needs `db/migrations/08_saved_resume.sql`.
- **Delete account** in Settings. It removes the account and everything tied to it after a typed confirmation.
- **Insights** (`/dashboard/insights`): response and interview rates, the application pipeline, and scan trends.
- **Daily usage limits** per tool, shown next to the button when you're running low, with the exact time the next use frees up. Failed requests don't count.
- **Busy fallback.** When the main model is rate limited, requests retry once on `GROQ_FALLBACK_MODEL`.
- "Suggest it on GitHub" link in the Student Hub, and `npm run check:links` for its links.

### Changed

- New look: plum and highlighter palette in light and dark mode, Bricolage Grotesque and Atkinson Hyperlegible Next, Phosphor icons, a new logo, favicon, and share image.
- Simpler navigation: six sections (Home, New application, Resume & letters, Interview prep, Applications, Student Hub) with tabs inside each.
- A shorter home page and a lighter dashboard that shows what needs attention first.
- Student Hub content moved to `content/student-hub/` and re-checked. Unfilled template fields read `[your name]` instead of disappearing.
- Sign-up honors `?next=`, and every protected route keeps its destination through sign-in.
- New sign-in and sign-up screens, each with its own brand panel. New passwords need at least 8 characters.
- Privacy and terms are one short page at `/privacy` (`/terms` redirects there). Questions and feedback go to GitHub Discussions instead of a contact form, so SMTP is no longer needed.
- The home page demo shows the real loop on a posting and a resume: match, fix, track.
- Database setup is now the three base files plus numbered files in `db/migrations/`, and new installs no longer create the unused `subscriptions` table.
- `.env.example` lists only the variables the app reads, split into required and optional.

### Fixed

- `next build` failed on a Recharts tooltip type and an unescaped apostrophe.
- The main scanner (`/api/ats-scan`) had no usage limit.
- The home page scrolled sideways on phones.

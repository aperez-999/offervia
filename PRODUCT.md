# Product

## Register

product

The signed-in app is the main surface. The landing page (`app/(public)/page.tsx`) is the one place that uses the brand register: more motion, bigger type, previews of the app.

## Platform

web

## Users

Students, new grads, and anyone applying for jobs, usually without a career coach or anyone to look over their applications. They're often on their 30th or 40th application, tired, and working late or on a phone between classes or shifts. Most have one resume and a stack of postings, and no time to rewrite it for each one.

## Product Purpose

A free job search tool. You paste a posting and Offervia shows what your resume is missing, rewrites it for that job, drafts a cover letter, lets you practice the interview, and tracks the application. Students also get a hub of email templates, free student deals, and learning resources. Tools that call Groq have a daily limit so one shared key stays quick for everyone.

It's done its job when someone sends a stronger application in less time and knows what to do next.

## Positioning

The generous friend who's been through recruiting and walks you through your own application, not a corporate HR product or another resume builder. It's free with no upsell, it's open source, and it's organized around the job you're applying to, not around a document.

## Brand Personality

Sharp, encouraging, practical. Plain words, and specific feedback over cheerleading. It feels like a well-kept notebook with a highlighter in it: the important parts are marked, the rest stays out of the way.

## Anti-references

- Generic AI SaaS: purple gradients, glassmorphism, "supercharge your career" copy, sparkle icons everywhere.
- Corporate HR portals: gray, dense, and impersonal.
- Upsell-heavy resume sites: paywalls behind every download, fake urgency, countdown timers.
- Cream and beige "editorial" pages with italic serif headlines.

## Design Principles

1. **Highlight what matters.** The lime highlighter only marks meaning: a matched keyword, a win, the current item. If everything is highlighted, nothing is.
2. **Every screen answers "what do I do next?"** Empty states teach the tool, and errors say what happened and what to try.
3. **Honest about limits.** Say exactly when a daily limit frees up. Never hide that the drafts need checking.
4. **Calm in the app, expressive on the landing page.** The app uses 150–250ms state transitions, and the landing page gets one choreographed entrance.
5. **Human copy.** Second person, short sentences, no buzzwords, few em dashes.

## Accessibility & Inclusion

- WCAG 2.2 AA contrast in both themes. Text on the highlighter always uses `--highlight-foreground`.
- The body font is Atkinson Hyperlegible Next, chosen for readability.
- Every animation has a reduced-motion fallback, and nothing is hidden until an animation runs.
- Full keyboard support, visible focus rings, 44px touch targets on mobile.

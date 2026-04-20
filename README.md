# 🧠 Offervia — Your AI Co-Pilot From Application to Offer

**Offervia** is an AI-powered web app that helps students and early professionals navigate the job search — from tailoring resumes to tracking applications — all in one clean, secure, and free platform.

Built with 💜 by **PerezDev** (Alejandro Perez-Rivero), leveraging **Groq + Supabase + Next.js** to deliver a fast, modern, privacy-focused experience.

---

## 🚀 Elevator Pitch

> **Offervia — Your AI Co-Pilot From Application to Offer**  
> Tailor resumes, analyze job descriptions, chat with an AI interview coach, and track your job hunt — all powered by open AI technology and modern web infrastructure.

---

## ✨ Core Features (MVP)

| Feature | Description |
|----------|--------------|
| 🎯 **Resume Tailor** | Paste a job description → instantly get tailored resume bullets, summary, and ATS keyword match. |
| 🧠 **JD Scanner** | Highlights required skills, missing keywords, seniority level, and visa hints. |
| 💬 **AI Career Coach** | Chat for behavioral, technical, or STAR-based interview prep. |
| 📊 **Job Tracker** | Manage job applications with CRUD, filters, and follow-up reminders. |
| 📈 **Weekly Insights** | Auto-recap: “You applied to 12 roles; follow up on 4.” |

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| **Backend / Auth / DB** | Supabase (Auth, Postgres, RLS) |
| **AI Layer** | Groq API (`llama-3.1-70b-versatile`) |
| **Deployment** | Vercel (Free Tier) |
| **State / Forms** | React Hook Form + Zod |
| **Analytics (optional)** | PostHog (Free Plan) |
| **Tooling** | ESLint + Prettier + Husky (pre-commit) |

---

## 🧱 Architecture Overview
Next.js (App Router)
- **Public**: `/`, `/login`, `/signup`
- **Protected**: `/dashboard`, `/tracker`, `/coach`, `/resume`, `/scanner`, `/settings`, `/profile`
- **API routes**:
  - `/api/resume-tailor`
  - `/api/job-scan`
  - `/api/coach`
  - `/api/tracker`
  - Billing: `/api/create-checkout-session`, `/api/create-portal-session`, `/api/stripe-webhook`

Supabase provides Auth + Postgres (RLS), and Groq is called server-side only.

---

## 🗂 Project Structure (this repo)
offervia/
├─ app/
│  ├─ (auth)/              → Login, Signup
│  ├─ (protected)/         → Dashboard, Resume, Scanner, Coach, Tracker, Settings
│  ├─ api/                 → Route handlers (resume-tailor, job-scan, coach, tracker, billing)
│  └─ layout.tsx
├─ components/             → UI + feature components
├─ lib/                    → Supabase, Groq, usage/billing helpers
├─ db/                     → `schema.sql` + `policies.sql`
├─ public/
├─ .env.example
└─ README.md

---

## 🧮 Database Schema (Supabase)
This repo includes SQL you can paste into the Supabase SQL editor:
- `db/schema.sql`
- `db/policies.sql`

**Core tables used by the app**
- `applications` — job applications per user
- `messages` — AI chat history
- `subscriptions` — billing state (read-only for end users)
- `usage_snapshots` — monthly usage counters (read-only for end users)
- `job_scans` — scan history (read-only for end users)
- `profiles`, `user_prefs` — profile + settings
- `request_events` — rate limiting events (service-role only)

**Row Level Security**
- Most user tables enforce ownership via `auth.uid()`.
- Tables written by backend/webhooks use the **service role key** and bypass RLS (as intended).

---

## ⚙️ API Endpoints

| Endpoint | Method | Description |
|-----------|---------|-------------|
| `/api/resume-tailor` | `POST` | Tailors a resume to a job description (supports JSON and multipart upload) |
| `/api/job-scan` | `POST` | Extracts skills + keyword gaps (returns JSON) |
| `/api/coach` | `POST` | Chat-based Q&A with AI coach |
| `/api/tracker` | `GET/POST/PATCH/DELETE` | CRUD operations for job applications |

---

## 🔐 Environment Variables

| Variable | Description |
|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase key |
| `GROQ_API_KEY` | Server-only Groq API key |
| `GROQ_MODEL` | Model version |
| `NEXT_PUBLIC_APP_NAME` | “Offervia” |
| `NEXT_PUBLIC_SITE_URL` | Base domain |
| `SMTP_*` | Gmail SMTP config |
| `CONTACT_*` | Contact email routing |
| `NEXT_PUBLIC_STRIPE_PRICE_ID` | Stripe Price ID for Pro (safe to expose) |
| `STRIPE_SECRET_KEY` | Stripe secret key (server-only) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (server-only) |

---

## 💬 AI System Prompts

| Module | Role |
|---------|------|
| 🧩 **Tailor** | Rewrites resume bullets concisely with measurable impact, using JD keywords. |
| 🔍 **Scanner** | Extracts only factual skills & keywords without hallucination. |
| 🎙 **Coach** | Acts as an interview coach using STAR; brief answers by default. |

---

## 🧰 Local Setup

```bash
# 1️⃣ Clone project
git clone https://github.com/perezdev/offervia.git
cd offervia

# 2️⃣ Install dependencies
npm install

# 3️⃣ Configure environment
cp .env.example .env.local
# Fill Supabase + Groq credentials

# 4️⃣ Setup Supabase schema + policies
# Paste `db/schema.sql` then `db/policies.sql` into the Supabase SQL Editor

# 5️⃣ Start dev server
pnpm dev

## Deployment (Vercel)
	1.	Connect GitHub repo → Vercel
	2.	Add all .env variables under Project → Settings → Environment Variables
	3.	Deploy production build

vercel --prod

Credits & License

Developed by PerezDev
Created by Alejandro Perez-Rivero
© 2025 Offervia / PerezDev — All Rights Reserved
Licensed under the MIT License




Built for students, by a student — empowering every career journey.”
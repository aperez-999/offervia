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
Next.js (app/)
├─ Public:      /, /login, /signup
├─ Protected:   /dashboard, /tracker, /coach, /resume
├─ API routes:  /api/ai/*, /api/tracker
│
├─ Supabase:    Auth + Tables (applications, prompts, messages)
└─ Groq:        Server-side inference only

---

## 🗂 Recommended Folder Structure
offervia/
├─ app/
│  ├─ (public)/            → Landing, Pricing
│  ├─ (auth)/              → Login, Signup
│  ├─ (protected)/         → Dashboard, Resume, Scanner, Coach, Tracker
│  ├─ api/ai/              → Tailor / Scan / Coach endpoints
│  ├─ api/tracker/         → CRUD job applications
│  └─ layout.tsx
│
├─ components/             → UI (shadcn), layout, forms, tables
├─ lib/                    → Supabase, Groq, Auth utilities
├─ db/                     → schema.sql + policies.sql
├─ styles/                 → globals.css
├─ .env.example
├─ package.json
└─ README.md

---

## 🧮 Database Schema (Supabase)

**Tables**

- `applications` — job applications per user  
- `messages` — AI chat history  
- `prompts` — system prompts per user  

**Row Level Security**

Each table enforces `auth.uid()` ownership for full data privacy.

---

## ⚙️ API Endpoints

| Endpoint | Method | Description |
|-----------|---------|-------------|
| `/api/ai/tailor` | `POST` | Returns tailored bullets & summary for a resume |
| `/api/ai/scan` | `POST` | Extracts required skills and keyword gaps |
| `/api/ai/coach` | `POST` | Chat-based Q&A with AI coach |
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

# 4️⃣ Setup Supabase schema
# Paste /db/schema.sql into Supabase SQL Editor

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
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Sun, Moon, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import BrandLogo from "@/components/brand/BrandLogo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* full-screen subtle animated gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-[1200px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200/50 via-indigo-100/20 to-transparent blur-3xl dark:hidden" />
        <div className="absolute bottom-0 right-0 h-56 w-56 translate-y-1/3 rounded-full bg-indigo-100/40 blur-2xl dark:hidden" />
        <div className="absolute top-28 right-1/3 h-40 w-40 rounded-full bg-amber-100/30 blur-2xl dark:hidden" />
        <div className="hidden dark:block absolute -top-24 left-1/2 h-72 w-[1200px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-900/25 via-indigo-800/10 to-transparent blur-3xl" />
        <div className="hidden dark:block absolute bottom-0 right-0 h-56 w-56 translate-y-1/3 rounded-full bg-indigo-950/20 blur-2xl" />
        <div className="hidden dark:block absolute top-24 right-1/3 h-40 w-40 rounded-full bg-amber-500/10 blur-2xl" />
        {/* faint noise / texture */}
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
      </div>

      {/* minimal header (matched to public layout styles) */}
      <header className="sticky top-0 z-40">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-background/70 to-transparent backdrop-blur" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-3">
          <div className="pointer-events-auto rounded-2xl border border-border/70 bg-background/70 shadow-sm backdrop-blur">
            <div className="flex h-12 items-center justify-between px-3 sm:px-4">
              <Link
                href="/"
                className="group flex items-center"
                aria-label="Offervia — Home"
              >
                <BrandLogo
                  width={190}
                  height={48}
                  priority
                  className="h-10 transition-transform group-hover:scale-[1.02] sm:h-11"
                />
              </Link>
              <nav className="hidden items-center gap-2 sm:gap-3 sm:flex">
                <Link
                  href="/privacy"
                  className="inline-flex rounded-full px-3 py-1.5 text-sm text-foreground/80 hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 dark:focus:ring-offset-black"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="inline-flex rounded-full px-3 py-1.5 text-sm text-foreground/80 hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 dark:focus:ring-offset-black"
                >
                  Terms
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex rounded-full px-3 py-1.5 text-sm text-foreground/80 hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 dark:focus:ring-offset-black"
                >
                  Contact
                </Link>
                <button
                  aria-label="Toggle theme"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 dark:focus:ring-offset-black"
                >
                  {!mounted ? null : resolvedTheme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </button>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Split layout (marketing + form) */}
      <main className="mx-auto grid min-h-[calc(100vh-56px)] max-w-7xl items-center gap-6 px-4 py-8 sm:py-12 lg:grid-cols-2 lg:gap-10 lg:px-8">
        {/* Left: value prop (hidden on small screens) */}
        <div className="hidden lg:block">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="rounded-3xl border border-border bg-card/60 p-8 shadow-2xl shadow-black/10 ring-1 ring-white/5 dark:ring-black/10 backdrop-blur dark:shadow-black/40"
          >
            <div className="inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-foreground">
              Offervia • AI career suite
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
              The fastest way to go from job post → offer.
            </h2>
            <p className="mt-3 text-sm text-foreground/70">
              Scan the posting, tailor your resume, and track follow‑ups with a workflow designed for momentum.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { t: "Job scan insights", d: "Keyword gaps + strengths, instantly." },
                { t: "Resume tailoring", d: "ATS-friendly edits that stay concise." },
                { t: "Interview coach", d: "Practice prompts + targeted feedback." },
                { t: "Application tracker", d: "Keep follow‑ups from slipping." },
              ].map((x) => (
                <div key={x.t} className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="text-sm font-medium text-foreground">{x.t}</div>
                  <div className="mt-1 text-xs text-foreground/70">{x.d}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-background/60 p-4">
              <div className="text-sm font-medium text-foreground">Why it works</div>
              <ul className="mt-2 space-y-2 text-xs text-foreground/70">
                {[
                  { icon: Zap, t: "Faster iteration per application" },
                  { icon: ShieldCheck, t: "Clear, server-side AI processing" },
                  { icon: Sparkles, t: "Workflow built for momentum" },
                ].map(({ icon: Icon, t }) => (
                  <li key={t} className="flex items-start gap-2">
                    <Icon className="mt-0.5 h-4 w-4 text-indigo-500/80" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Right: auth card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mx-auto w-full max-w-md"
        >
          <div className="rounded-3xl border border-border bg-card/60 p-6 shadow-2xl shadow-black/10 ring-1 ring-white/5 dark:ring-black/10 backdrop-blur dark:shadow-black/40">
            {/* Mobile-only mini value prop to make auth feel premium */}
            <div className="mb-5 lg:hidden">
              <div className="inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-foreground">
                Offervia • AI career suite
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {[
                  { icon: Zap, t: "Faster iteration" },
                  { icon: ShieldCheck, t: "Server-side AI flow" },
                  { icon: Sparkles, t: "Built for momentum" },
                ].map(({ icon: Icon, t }) => (
                  <div key={t} className="rounded-2xl border border-border bg-background/60 p-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-indigo-500/80" />
                      <div className="text-xs font-medium text-foreground">{t}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {children}
          </div>
        </motion.div>
      </main>

      <footer className="mx-auto flex h-12 max-w-7xl items-center justify-end px-4 text-xs text-foreground/70 sm:px-6 lg:px-8">
        <div className="hidden items-center gap-4 sm:flex">
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
          <Link href="/contact" className="hover:text-foreground">Contact</Link>
        </div>
      </footer>
    </div>
  );
}

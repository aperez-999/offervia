"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Sun, Moon, Sparkles, ShieldCheck, Zap, Quote, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import BrandLogo from "@/components/brand/BrandLogo";
import HeroDemo from "@/components/public/HeroDemo";
import { switchTheme, originFromEvent } from "@/lib/theme-transition";

const PROOF_QUOTES = [
  { q: "Tailored my resume in minutes and finally started hearing back.", a: "Maria · Product Designer" },
  { q: "The scanner showed exactly which keywords I was missing.", a: "Devon · Data Analyst" },
  { q: "Went from scattered tabs to one clear pipeline. Game changer.", a: "Priya · Software Engineer" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [qi, setQi] = useState(0);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const id = setInterval(() => setQi((i) => (i + 1) % PROOF_QUOTES.length), 4800);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* full-screen subtle animated gradient backdrop (token-driven) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="brand-glow absolute inset-x-0 -top-24 h-96" />
        <div className="absolute bottom-0 right-0 h-56 w-56 translate-y-1/3 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute top-28 right-1/3 h-40 w-40 rounded-full bg-[var(--chart-2)]/10 blur-2xl" />
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
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-background/80 backdrop-blur" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-3">
          <div className="pointer-events-auto rounded-2xl border border-border/70 bg-background/70 shadow-sm backdrop-blur">
            <div className="flex h-12 items-center justify-between px-3 sm:px-4">
              <Link
                href="/"
                className="group flex items-center"
                aria-label="Offervia — Home"
              >
                <BrandLogo
                  width={132}
                  height={33}
                  priority
                  className="h-7 transition-transform group-hover:scale-[1.02] sm:h-8"
                />
              </Link>
              <nav className="hidden items-center gap-2 sm:gap-3 sm:flex">
                <Link
                  href="/privacy"
                  className="inline-flex rounded-full px-3 py-1.5 text-sm text-foreground/80 hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="inline-flex rounded-full px-3 py-1.5 text-sm text-foreground/80 hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
                >
                  Terms
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex rounded-full px-3 py-1.5 text-sm text-foreground/80 hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
                >
                  Contact
                </Link>
                <button
                  aria-label="Toggle theme"
                  onClick={(e) =>
                    switchTheme(
                      () => setTheme((resolvedTheme ?? theme) === "dark" ? "light" : "dark"),
                      originFromEvent(e)
                    )
                  }
                  className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
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
        {/* Left: value prop + live interactive demo (hidden on small screens) */}
        <div className="hidden lg:block">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="space-y-5"
          >
            <div>
              <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground">
                Offervia • AI career suite
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground text-balance">
                The fastest way to go from job post → offer.
              </h2>
              <p className="mt-3 max-w-xl text-sm text-foreground/70">
                Scan the posting, tailor your resume, and track follow‑ups with a workflow designed for momentum.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <p className="text-sm text-foreground">
                <span className="font-semibold text-primary">More callbacks</span>{" "}
                from sharper, role‑matched applications.
              </p>
            </div>

            {/* Live, self-driving product demo — same interactive mock as the landing page */}
            <HeroDemo />

            {/* Rotating social proof */}
            <div className="min-h-[84px] rounded-2xl border border-border bg-card p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
              <Quote className="h-4 w-4 text-primary/70" />
              <AnimatePresence mode="wait">
                <motion.figure
                  key={qi}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="mt-2"
                >
                  <blockquote className="text-sm leading-relaxed text-foreground/85">
                    “{PROOF_QUOTES[qi].q}”
                  </blockquote>
                  <figcaption className="mt-1.5 text-xs font-medium text-foreground/60">
                    {PROOF_QUOTES[qi].a}
                  </figcaption>
                </motion.figure>
              </AnimatePresence>
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
          <div className="rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-black/10 ring-1 ring-white/5 dark:ring-black/10 dark:shadow-black/40">
            {/* Mobile-only mini value prop to make auth feel premium */}
            <div className="mb-5 lg:hidden">
              <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground">
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
                      <Icon className="h-4 w-4 text-primary/80" />
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

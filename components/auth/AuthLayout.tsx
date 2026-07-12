"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Sun, Moon, Sparkles, ShieldCheck, Zap, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import BrandLogo from "@/components/brand/BrandLogo";
import { switchTheme, originFromEvent } from "@/lib/theme-transition";

/** Calm reassurance panel used when a page doesn't supply its own aside
 *  (e.g. forgot / reset password). */
function DefaultAside() {
  return (
    <div className="space-y-5">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        Account security
      </div>
      <h2 className="text-3xl font-semibold tracking-tight text-foreground text-balance">
        Your account, safe and sound.
      </h2>
      <p className="max-w-xl text-sm text-foreground/70">
        We’ll get you back in quickly. Your data stays private and encrypted — no
        spam, ever.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: Lock, t: "Encrypted" },
          { icon: ShieldCheck, t: "Private by default" },
          { icon: Sparkles, t: "Built for momentum" },
        ].map(({ icon: Icon, t }) => (
          <div
            key={t}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10"
          >
            <Icon className="h-4 w-4 text-primary/80" />
            <div className="mt-2 text-sm font-medium text-foreground">{t}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AuthLayout({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
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
        {/* Left: page-specific marketing aside (hidden on small screens) */}
        <div className="hidden lg:block">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            {aside ?? <DefaultAside />}
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

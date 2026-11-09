"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Moon, Sun } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";
import BrandLogo from "@/components/brand/BrandLogo";
import { switchTheme, originFromEvent } from "@/lib/theme-transition";

/** Used when a page doesn't supply its own aside (forgot / reset password). */
function DefaultAside() {
  return (
    <div className="max-w-xl space-y-3">
      <h2 className="text-3xl font-semibold tracking-tight text-foreground text-balance">
        Locked out? This takes a minute.
      </h2>
      <p className="text-sm text-foreground/70 text-pretty">
        We&apos;ll email you a link to set a new password. If it doesn&apos;t show up
        in a few minutes, check your spam folder or request another one.
      </p>
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
      {/* minimal header (matched to public layout styles) */}
      <header className="sticky top-0 z-40">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-background/80 backdrop-blur" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-3">
          <div className="pointer-events-auto rounded-2xl border border-border/70 bg-background/70 shadow-sm backdrop-blur">
            <div className="flex h-12 items-center justify-between px-3 sm:px-4">
              <Link
                href="/"
                className="group flex items-center"
                aria-label="Offervia home"
              >
                <BrandLogo className="h-7 transition-transform group-hover:scale-[1.02] sm:h-8" />
              </Link>
              <nav className="hidden items-center gap-2 sm:gap-3 sm:flex">
                <Link
                  href="/privacy"
                  className="inline-flex rounded-full px-3 py-1.5 text-sm text-foreground/80 hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background"
                >
                  Privacy
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
          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/5 dark:shadow-black/30">
            {children}
          </div>
        </motion.div>
      </main>

      <footer className="mx-auto flex h-12 max-w-7xl items-center justify-end px-4 text-xs text-foreground/70 sm:px-6 lg:px-8">
        <div className="hidden items-center gap-4 sm:flex">
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}

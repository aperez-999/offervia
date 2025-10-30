"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* full-screen subtle animated gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 animate-pulse">
        <div className="absolute -top-24 left-1/2 h-72 w-[1200px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-100 via-indigo-50 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 h-56 w-56 translate-y-1/3 rounded-full bg-indigo-100/60 blur-2xl" />
        <div className="absolute top-20 right-1/3 h-40 w-40 rounded-full bg-amber-50/70 blur-2xl" />
      </div>

      {/* minimal header (matched to public layout styles) */}
      <header className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center text-base font-semibold tracking-tight"
          aria-label="Offervia — Home"
        >
          <Image src="/logo.png" alt="Offervia" width={28} height={28} className="rounded-sm transition-transform group-hover:scale-[1.03]" />
          <span className="ml-2 font-semibold">Offervia</span>
        </Link>
        <nav className="hidden items-center gap-2 sm:gap-3 sm:flex">
          <Link
            href="/privacy"
            className="inline-flex rounded-md px-3 py-1.5 text-sm text-foreground/90 hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 dark:focus:ring-offset-black"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="inline-flex rounded-md px-3 py-1.5 text-sm text-foreground/90 hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 dark:focus:ring-offset-black"
          >
            Terms
          </Link>
          <Link
            href="/contact"
            className="inline-flex rounded-md px-3 py-1.5 text-sm text-foreground/90 hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 dark:focus:ring-offset-black"
          >
            Contact
          </Link>
          <button
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background/80 hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 dark:focus:ring-offset-black"
          >
            {!mounted ? null : resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </nav>
      </header>

      {/* animated auth card container */}
      <main className="mx-auto flex min-h-[calc(100vh-56px)] max-w-6xl items-center justify-center px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto w-full max-w-md rounded-2xl border border-white/20 bg-white/70 p-6 shadow-xl backdrop-blur-lg dark:bg-white/5"
        >
          {children}
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

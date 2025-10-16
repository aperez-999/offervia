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

      {/* minimal header */}
      <header className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="Offervia" width={28} height={28} className="rounded" />
          <span className="ml-2 text-sm font-semibold">Offervia</span>
        </Link>
        <nav className="hidden items-center gap-4 text-xs text-gray-600 dark:text-gray-300 sm:flex">
          <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white">Terms</Link>
          <Link href="/contact" className="hover:text-gray-900 dark:hover:text-white">Contact</Link>
          <button
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
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

      <footer className="mx-auto flex h-12 max-w-6xl items-center justify-end px-4 text-xs text-gray-600/80 sm:px-6 lg:px-8">
        <div className="hidden items-center gap-4 sm:flex">
          <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-900">Terms</Link>
          <Link href="/contact" className="hover:text-gray-900">Contact</Link>
        </div>
      </footer>
    </div>
  );
}

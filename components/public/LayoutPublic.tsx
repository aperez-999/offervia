"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LayoutPublic({ children }: { children: React.ReactNode }) {
  // Smooth in-page scroll
  function smoothScrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Sticky header state + subtle shadow when scrolled
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Theme toggle with safe hydration
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleTheme = () => {
    if (!mounted) return;
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth">
      <header
        className={`sticky top-0 z-40 backdrop-blur transition-all duration-300 ${
          scrolled
            ? "bg-background/85 border-b border-border shadow-[0_1px_0_0_rgba(0,0,0,0.02)]"
            : "bg-background/65"
        }`}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link
            href="/"
            className="group flex items-center text-base font-semibold tracking-tight"
            aria-label="Offervia — Home"
          >
            <Image
              src="/logo.png"
              alt="Offervia"
              width={28}
              height={28}
              style={{ width: "28px", height: "28px" }}
              className="rounded-sm transition-transform group-hover:scale-[1.03]"
            />
            <span className="ml-2 font-semibold">Offervia</span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-2 sm:gap-3">
            {/* Mobile menu button */}
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background/80 hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 dark:focus:ring-offset-black sm:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                smoothScrollTo("features");
              }}
              className="hidden sm:inline-flex rounded-md px-3 py-1.5 text-sm text-foreground/90 hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 dark:focus:ring-offset-black"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                smoothScrollTo("how-it-works");
              }}
              className="hidden sm:inline-flex rounded-md px-3 py-1.5 text-sm text-foreground/90 hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 dark:focus:ring-offset-black"
            >
              How it works
            </a>

            <a
              href="#pricing"
              onClick={(e) => {
                e.preventDefault();
                smoothScrollTo("pricing");
              }}
              className="hidden sm:inline-flex rounded-md px-3 py-1.5 text-sm text-foreground/90 hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 dark:focus:ring-offset-black"
            >
              Pricing
            </a>

            <a
              href="#faq"
              onClick={(e) => {
                e.preventDefault();
                smoothScrollTo("faq");
              }}
              className="hidden sm:inline-flex rounded-md px-3 py-1.5 text-sm text-foreground/90 hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 dark:focus:ring-offset-black"
            >
              FAQ
            </a>

            <Link
              href="/contact"
              className="hidden sm:inline-flex rounded-md px-3 py-1.5 text-sm text-foreground/90 hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 dark:focus:ring-offset-black"
            >
              Contact
            </Link>

            <Link
              href="/login"
              className="hidden sm:inline-flex rounded-md px-3 py-1.5 text-sm text-foreground/90 hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 dark:focus:ring-offset-black"
            >
              Sign In
            </Link>

            <Link
              href="/signup"
              className="hidden sm:inline-flex rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-black"
            >
              Sign Up
            </Link>

            {/* Theme toggle with animated icon swap */}
            <button
              aria-label="Toggle theme"
              aria-pressed={mounted && resolvedTheme === "dark"}
              onClick={toggleTheme}
              className="ml-1 inline-flex h-9 w-9 items-center cursor-pointer justify-center rounded-md border border-border bg-background/80 hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 dark:focus:ring-offset-black"
            >
              {mounted && (
                <AnimatePresence mode="wait" initial={false}>
                  {resolvedTheme === "dark" ? (
                    <motion.span
                      key="sun"
                      initial={{ rotate: -90, scale: 0.8, opacity: 0 }}
                      animate={{ rotate: 0, scale: 1, opacity: 1 }}
                      exit={{ rotate: 90, scale: 0.8, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                      className="text-foreground"
                    >
                      <Sun className="h-4 w-4" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="moon"
                      initial={{ rotate: 90, scale: 0.8, opacity: 0 }}
                      animate={{ rotate: 0, scale: 1, opacity: 1 }}
                      exit={{ rotate: -90, scale: 0.8, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                      className="text-foreground"
                    >
                      <Moon className="h-4 w-4" />
                    </motion.span>
                  )}
                </AnimatePresence>
              )}
            </button>
          </nav>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence initial={false}>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="sm:hidden border-t border-border bg-background/85 backdrop-blur"
            >
              <div className="mx-auto max-w-7xl px-4 py-3">
                <div className="grid gap-2 text-sm">
                  {[
                    { label: "Features", id: "features" },
                    { label: "How it works", id: "how-it-works" },
                    { label: "Pricing", id: "pricing" },
                    { label: "FAQ", id: "faq" },
                  ].map((x) => (
                    <button
                      key={x.id}
                      type="button"
                      className="text-left rounded-md px-3 py-2 text-foreground/90 hover:bg-foreground/5"
                      onClick={() => {
                        setMobileOpen(false);
                        smoothScrollTo(x.id);
                      }}
                    >
                      {x.label}
                    </button>
                  ))}
                  <Link
                    href="/contact"
                    className="rounded-md px-3 py-2 text-foreground/90 hover:bg-foreground/5"
                    onClick={() => setMobileOpen(false)}
                  >
                    Contact
                  </Link>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      className="rounded-md border border-border px-3 py-2 text-center text-foreground hover:bg-foreground/5"
                      onClick={() => setMobileOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="rounded-md bg-indigo-600 px-3 py-2 text-center font-medium text-white hover:bg-indigo-500"
                      onClick={() => setMobileOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>{children}</main>
    </div>
  );
}
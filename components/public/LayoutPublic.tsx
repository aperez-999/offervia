"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function LayoutPublic({ children }: { children: React.ReactNode }) {
  function smoothScrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 scroll-smooth">
      <header className={`sticky top-0 z-40 backdrop-blur transition-colors ${
        scrolled ? "bg-white/90 border-b border-gray-200" : "bg-white/60"
      }`}>
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-base font-semibold tracking-tight">
            Offervia
          </Link>
          <nav className="flex items-center gap-4">
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                smoothScrollTo("features");
              }}
              className="hidden rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 sm:block"
            >
              Features
            </a>
            <Link href="/login" className="rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              Sign In
            </Link>
            <Link href="/signup" className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500">
              Sign Up
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";
import BrandLogo from "@/components/brand/BrandLogo";
import { switchTheme, originFromEvent } from "@/lib/theme-transition";

function TopBar() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
      <Link href="/" aria-label="Offervia home" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <BrandLogo className="h-7 sm:h-8" />
      </Link>
      <button
        type="button"
        aria-label="Switch light or dark mode"
        onClick={(e) =>
          switchTheme(() => setTheme((resolvedTheme ?? theme) === "dark" ? "light" : "dark"), originFromEvent(e))
        }
        className="grid size-9 place-items-center rounded-full border border-border bg-card/70 text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {!mounted ? null : resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>
    </header>
  );
}

/**
 * Shell for sign-in screens. "split" puts a brand panel next to the form
 * (sign in and sign up). "centered" is a single card (password reset).
 */
export default function AuthLayout({
  children,
  variant = "centered",
  panel,
  panelSide = "left",
}: {
  children: React.ReactNode;
  variant?: "centered" | "split";
  panel?: React.ReactNode;
  /** Which side the brand panel sits on in the split layout (desktop only). */
  panelSide?: "left" | "right";
}) {
  if (variant === "split") {
    const right = panelSide === "right";
    return (
      <div
        className={`min-h-dvh bg-background text-foreground lg:grid ${
          right ? "lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]" : "lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]"
        }`}
      >
        <div className={`lg:min-h-dvh ${right ? "lg:order-2" : ""}`}>{panel}</div>
        <div className="flex min-h-dvh flex-col">
          <TopBar />
          <main className="flex flex-1 items-start justify-center px-4 pb-12 pt-4 sm:items-center sm:pt-0">
            <div className="enter w-full max-w-sm">{children}</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <TopBar />
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:items-center sm:pt-0">
        <div className="enter w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-[0_24px_60px_-40px_color-mix(in_oklab,var(--primary)_60%,transparent)] sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

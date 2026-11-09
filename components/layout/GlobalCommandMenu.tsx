"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { switchTheme } from "@/lib/theme-transition";
import { getBrowserSupabase } from "@/lib/supabase/client";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { BookOpen, Books, Briefcase, ChatCircleText, EnvelopeSimple, FileText, GearSix, GraduationCap, Kanban, ListChecks, MagnifyingGlass, MagnifyingGlass as SearchIcon, Microphone, Monitor, Moon, PenNib, Scales, SignOut, SquaresFour, Sun, UserCircle } from "@phosphor-icons/react/dist/ssr";
import { DISCUSSIONS_URL } from "@/lib/github";

type Nav = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };

export const NAV_ITEMS: Nav[] = [
  { label: "Dashboard", href: "/dashboard", icon: SquaresFour },
  { label: "Job Packet", href: "/job-packet", icon: Briefcase },
  { label: "Resume", href: "/resume", icon: FileText },
  { label: "Cover Letter", href: "/cover-letter", icon: PenNib },
  { label: "Scanner", href: "/scanner", icon: SearchIcon },
  { label: "Coach", href: "/coach", icon: ChatCircleText },
  { label: "Interview", href: "/interview", icon: Microphone },
  { label: "Bullet check", href: "/bullet-check", icon: ListChecks },
  { label: "Compare offers", href: "/offers", icon: Scales },
  { label: "Tracker", href: "/tracker", icon: Kanban },
  { label: "Documents", href: "/documents", icon: Books },
  { label: "Student Hub", href: "/student-hub", icon: GraduationCap },
  { label: "Templates", href: "/student-hub?tab=templates", icon: EnvelopeSimple },
  { label: "Learning resources", href: "/student-hub?tab=resources", icon: BookOpen },
  { label: "Student deals", href: "/student-hub?tab=deals", icon: GraduationCap },
  { label: "Questions and feedback", href: DISCUSSIONS_URL, icon: EnvelopeSimple },
  { label: "Settings", href: "/settings", icon: GearSix },
  { label: "Profile", href: "/profile", icon: UserCircle },
];

export default function GlobalCommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const supabase = useMemo(() => getBrowserSupabase(), []);

  // ⌘K / Ctrl+K to open
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    if (/^https?:/.test(href)) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(href);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    router.replace("/login");
    router.refresh();
  };

  return (
    <>
      {/* Small trigger in the topbar */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
        aria-label="Open command palette"
      >
        <MagnifyingGlass className="h-4 w-4" />
        <span className="hidden sm:inline text-xs">Search</span>
        <kbd className="hidden sm:inline rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-medium">⌘K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages and actions…" />
        <CommandList>
          <CommandEmpty>No matching pages or actions.</CommandEmpty>

          {/* Navigation */}
          <CommandGroup heading="Navigate">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <CommandItem key={href} onSelect={() => go(href)}>
                <Icon className="mr-2 h-4 w-4" />
                <span className={pathname === href ? "font-medium" : ""}>{label}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* Quick Actions */}
          <CommandGroup heading="Quick actions">
            <CommandItem onSelect={() => go("/job-packet")}>
              <Briefcase className="mr-2 h-4 w-4" />
              Start Job Packet
            </CommandItem>
            <CommandItem onSelect={() => go("/resume")}>
              <FileText className="mr-2 h-4 w-4" />
              Tailor resume
            </CommandItem>
            <CommandItem onSelect={() => go("/cover-letter")}>
              <PenNib className="mr-2 h-4 w-4" />
              Write cover letter
            </CommandItem>
            <CommandItem onSelect={() => go("/scanner")}>
              <SearchIcon className="mr-2 h-4 w-4" />
              Scan job description
            </CommandItem>
            <CommandItem onSelect={() => go("/tracker?new=1")}>
              <Kanban className="mr-2 h-4 w-4" />
              Add application
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Theme Switching */}
          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => switchTheme(() => setTheme("light"))}>
              <Sun className="mr-2 h-4 w-4" />
              Light
              {resolvedTheme === "light" && <CommandShortcut>✓</CommandShortcut>}
            </CommandItem>
            <CommandItem onSelect={() => switchTheme(() => setTheme("dark"))}>
              <Moon className="mr-2 h-4 w-4" />
              Dark
              {resolvedTheme === "dark" && <CommandShortcut>✓</CommandShortcut>}
            </CommandItem>
            <CommandItem onSelect={() => switchTheme(() => setTheme("system"))}>
              <Monitor className="mr-2 h-4 w-4" />
              System
              {resolvedTheme === "system" && <CommandShortcut>✓</CommandShortcut>}
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Account */}
          <CommandGroup heading="Account">
            <CommandItem onSelect={() => go("/settings")}>
              <GearSix className="mr-2 h-4 w-4" />
              Settings
            </CommandItem>
            <CommandItem onSelect={() => go("/profile")}>
              <UserCircle className="mr-2 h-4 w-4" />
              Profile
            </CommandItem>
            <CommandItem onSelect={signOut}>
              <SignOut className="mr-2 h-4 w-4" />
              Sign out
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

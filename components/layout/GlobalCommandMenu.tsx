"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
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
import {
  Search,
  LayoutDashboard,
  FileText,
  Search as SearchIcon,
  MessageSquare,
  ClipboardList,
  BookOpen,
  GraduationCap,
  Settings,
  UserRound,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Mail,
  Briefcase,
} from "lucide-react";

type Nav = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };

export const NAV_ITEMS: Nav[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Job Packet", href: "/job-packet", icon: Briefcase },
  { label: "Resume", href: "/resume", icon: FileText },
  { label: "Scanner", href: "/scanner", icon: SearchIcon },
  { label: "Coach", href: "/coach", icon: MessageSquare },
  { label: "Tracker", href: "/tracker", icon: ClipboardList },
  { label: "Templates", href: "/templates", icon: Mail },
  { label: "Resources", href: "/resources", icon: BookOpen },
  { label: "Student Exclusives", href: "/students", icon: GraduationCap },
  { label: "Contact", href: "/contact", icon: Mail },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Profile", href: "/profile", icon: UserRound },
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
        className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-sm hover:bg-foreground/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
        aria-label="Open command palette"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline text-xs opacity-80">⌘K</span>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages and actions…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

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
              <CommandShortcut>J</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => go("/resume")}>
              <FileText className="mr-2 h-4 w-4" />
              Tailor Resume
              <CommandShortcut>R</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => go("/scanner")}>
              <SearchIcon className="mr-2 h-4 w-4" />
              Scan Job Description
              <CommandShortcut>S</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => go("/tracker?new=1")}>
              <ClipboardList className="mr-2 h-4 w-4" />
              New Application
              <CommandShortcut>N</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Theme Switching */}
          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" />
              Light
              {resolvedTheme === "light" && <CommandShortcut>✓</CommandShortcut>}
            </CommandItem>
            <CommandItem onSelect={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" />
              Dark
              {resolvedTheme === "dark" && <CommandShortcut>✓</CommandShortcut>}
            </CommandItem>
            <CommandItem onSelect={() => setTheme("system")}>
              <Monitor className="mr-2 h-4 w-4" />
              System
              {resolvedTheme === "system" && <CommandShortcut>✓</CommandShortcut>}
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Account */}
          <CommandGroup heading="Account">
            <CommandItem onSelect={() => go("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </CommandItem>
            <CommandItem onSelect={() => go("/profile")}>
              <UserRound className="mr-2 h-4 w-4" />
              Profile
            </CommandItem>
            <CommandItem onSelect={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

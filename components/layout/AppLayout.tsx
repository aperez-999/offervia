"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Sun,
  Moon,
  LayoutDashboard,
  FileText,
  Search,
  MessageSquare,
  ClipboardList,
  BookOpen,
  GraduationCap,
  Mail, // <- add this
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import UserMenu from "@/components/layout/UserMenu";

type NavItem = { label: string; href: string; icon: React.ComponentType<any> };

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Resume", href: "/resume", icon: FileText },
  { label: "Scanner", href: "/scanner", icon: Search },
  { label: "Coach", href: "/coach", icon: MessageSquare },
  { label: "Tracker", href: "/tracker", icon: ClipboardList },
  { label: "Templates", href: "/templates", icon: Mail }, // <- new
  { label: "Resources", href: "/resources", icon: BookOpen },
  { label: "Student Exclusives", href: "/students", icon: GraduationCap },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (search.get("login") === "1") {
      toast({ title: "Signed in — welcome back!" });
      router.replace("/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSignOut() {
    const supabase = getBrowserSupabase();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight">Offervia</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              aria-label="Toggle theme"
              aria-pressed={mounted && resolvedTheme === "dark"}
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border bg-background hover:bg-foreground/[0.06]"
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

            <UserMenu onSignOut={onSignOut} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6 py-6">
          <aside className="w-56 shrink-0">
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-foreground/60">
                Navigation
              </div>
              <div className="mb-2 h-px bg-border" />
              <nav className="space-y-1 text-sm">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "flex items-center gap-2 rounded-md px-2 py-1.5 border transition-colors",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black",
                        active
                          ? "border-border bg-foreground/[0.06] font-medium"
                          : "border-transparent hover:bg-foreground/[0.04]",
                      ].join(" ")}
                    >
                      <Icon className="h-5 w-5 stroke-[1.5]" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
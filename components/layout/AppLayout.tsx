"use client";

import Link from "next/link";
import BrandLogo from "@/components/brand/BrandLogo";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Search,
  MessageSquare,
  ClipboardList,
  BookOpen,
  GraduationCap,
  Mail,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import UserMenu from "@/components/layout/UserMenu";
import GlobalCommandMenu from "@/components/layout/GlobalCommandMenu";
import Footer from "@/components/public/Footer";
import { Button } from "@/components/ui/button";

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Job Packet", href: "/job-packet", icon: Sparkles },
  { label: "Resume", href: "/resume", icon: FileText },
  { label: "Scanner", href: "/scanner", icon: Search },
  { label: "Coach", href: "/coach", icon: MessageSquare },
  { label: "Tracker", href: "/tracker", icon: ClipboardList },
  { label: "Templates", href: "/templates", icon: Mail },
  { label: "Resources", href: "/resources", icon: BookOpen },
  { label: "Student Exclusives", href: "/students", icon: GraduationCap },
];

type PlanType = "free" | "pro";

export default function AppLayout({
  children,
  plan = "free",
}: {
  children: React.ReactNode;
  plan?: PlanType;
}) {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ Sign-in toast
  useEffect(() => {
    if (search.get("login") === "1") {
      toast({
        title: "Signed in — welcome back!",
        description: "You're now signed in to Offervia.",
        variant: "default",
      });
      router.replace("/dashboard");
    }
  }, [search, router, toast]);

  // ✅ Sign-out function + toast
  async function onSignOut() {
    const supabase = getBrowserSupabase();
    await supabase.auth.signOut();

    toast({
      title: "Signed out successfully",
      description: "Hope to see you again soon!",
      variant: "default",
    });

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Subtle app backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-[1200px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200/40 via-indigo-100/20 to-transparent blur-3xl dark:hidden" />
        <div className="hidden dark:block absolute -top-24 left-1/2 h-72 w-[1200px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-900/25 via-indigo-800/15 to-transparent blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-background/70 to-transparent backdrop-blur" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-3">
          <div className="pointer-events-auto rounded-2xl border border-border/70 bg-background/70 shadow-sm backdrop-blur">
            <div className="flex h-12 items-center justify-between px-3 sm:px-4">
          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open sidebar</span>
            </Button>
            <Link
              href="/dashboard"
              className="flex items-center transition-opacity hover:opacity-90"
              aria-label="Offervia"
            >
              <BrandLogo width={190} height={48} priority className="h-10 sm:h-11" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <GlobalCommandMenu />
            <UserMenu plan={plan} onSignOut={onSignOut} />
          </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex-1 w-full">
        <div className="flex gap-6 py-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-20 rounded-2xl border border-border bg-card/60 p-3 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
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
                          ? "border-indigo-500/20 bg-indigo-500/10 font-medium"
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

          {/* Mobile Sidebar Overlay */}
          <AnimatePresence>
            {sidebarOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/50 lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
                
                {/* Sidebar */}
                <motion.aside
                  initial={{ x: -280 }}
                  animate={{ x: 0 }}
                  exit={{ x: -280 }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="fixed left-0 top-0 z-50 h-full w-72 bg-background border-r border-border lg:hidden"
                >
                  <div className="flex h-14 items-center justify-between px-4 border-b border-border">
                    <span className="text-lg font-semibold tracking-tight">Navigation</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close sidebar</span>
                    </Button>
                  </div>
                  
                  <div className="p-4">
                    <nav className="space-y-1 text-sm">
                      {navItems.map((item) => {
                        const active = pathname === item.href;
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            aria-current={active ? "page" : undefined}
                            className={[
                              "flex items-center gap-3 rounded-md px-3 py-2.5 border transition-colors",
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
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Page content */}
          <main className="min-w-0 flex-1 w-full">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5 shadow-sm ring-1 ring-white/5 dark:ring-black/10"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}

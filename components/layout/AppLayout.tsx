"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import BrandLogo from "@/components/brand/BrandLogo";
import { usePathname, useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  PenLine,
  Search,
  MessageSquare,
  MicVocal,
  ClipboardList,
  GraduationCap,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import UserMenu from "@/components/layout/UserMenu";
import Footer from "@/components/public/Footer";
import PageTransition from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";

const GlobalCommandMenu = dynamic(() => import("@/components/layout/GlobalCommandMenu"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="h-8 w-[3.75rem] rounded-md border border-border bg-background/70"
    />
  ),
});

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Job Packet", href: "/job-packet", icon: Sparkles },
  { label: "Resume", href: "/resume", icon: FileText },
  { label: "Cover Letter", href: "/cover-letter", icon: PenLine },
  { label: "Scanner", href: "/scanner", icon: Search },
  { label: "Coach", href: "/coach", icon: MessageSquare },
  { label: "Interview", href: "/interview", icon: MicVocal },
  { label: "Tracker", href: "/tracker", icon: ClipboardList },
  { label: "Student Hub", href: "/student-hub", icon: GraduationCap },
];

type PlanType = "free" | "pro";

export default function AppLayout({
  children,
  plan = "free",
}: {
  children: React.ReactNode;
  plan?: PlanType;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("offervia:flash") === "login") {
        sessionStorage.removeItem("offervia:flash");
        toast({
          title: "Signed in — welcome back!",
          description: "You're now signed in to Offervia.",
          variant: "default",
        });
      }
    } catch {
      // noop
    }
  }, [toast]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }

    document.body.style.overflow = "";
    return undefined;
  }, [sidebarOpen]);

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
        <div className="brand-glow absolute inset-x-0 -top-24 h-72" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-background/70 to-transparent backdrop-blur" />
        <div className="mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8 xl:px-10 pt-3">
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
              <BrandLogo width={132} height={32} priority className="h-7 sm:h-8" />
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
      <div className="mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8 xl:px-10 flex-1 w-full">
        <div className="flex gap-8 py-6 sm:py-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-60 shrink-0">
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
                        "group flex items-center gap-2 rounded-md px-2 py-1.5 border transition-all duration-200",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        active
                          ? "border-primary/20 bg-primary/10 text-primary font-medium"
                          : "border-transparent hover:bg-accent hover:text-accent-foreground motion-safe:hover:translate-x-0.5",
                      ].join(" ")}
                    >
                      <Icon className="h-5 w-5 stroke-[1.5] transition-transform duration-200 motion-safe:group-hover:scale-110" />
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
                              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
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
            <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}

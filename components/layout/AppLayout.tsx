"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import BrandLogo from "@/components/brand/BrandLogo";
import { usePathname, useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Layers,
  FileText,
  PenLine,
  Search,
  MessageSquare,
  MicVocal,
  ClipboardList,
  GraduationCap,
  Library,
  Menu,
  X,
  ArrowRight,
  ListChecks,
  Scale,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import UserMenu from "@/components/layout/UserMenu";
import Footer from "@/components/public/Footer";
import PageTransition from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { GITHUB_REPO_URL } from "@/lib/github";

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

const navGroups: { label?: string; items: NavItem[] }[] = [
  { items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  {
    label: "Apply",
    items: [
      { label: "Job Packet", href: "/job-packet", icon: Layers },
      { label: "Resume", href: "/resume", icon: FileText },
      { label: "Cover Letter", href: "/cover-letter", icon: PenLine },
      { label: "ATS Scanner", href: "/scanner", icon: Search },
    ],
  },
  {
    label: "Prepare",
    items: [
      { label: "Coach", href: "/coach", icon: MessageSquare },
      { label: "Interview", href: "/interview", icon: MicVocal },
      { label: "Bullet Check", href: "/bullet-check", icon: ListChecks },
      { label: "Compare Offers", href: "/offers", icon: Scale },
    ],
  },
  {
    label: "Organize",
    items: [
      { label: "Tracker", href: "/tracker", icon: ClipboardList },
      { label: "Documents", href: "/documents", icon: Library },
      { label: "Student Hub", href: "/student-hub", icon: GraduationCap },
    ],
  },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({
  pathname,
  onNavigate,
  dense = false,
}: {
  pathname: string | null;
  onNavigate?: () => void;
  dense?: boolean;
}) {
  return (
    <nav className="space-y-4 text-sm">
      {navGroups.map((group, gi) => (
        <div key={group.label ?? gi} className="space-y-0.5">
          {group.label ? (
            <div className="px-2 pb-1 text-xs font-medium text-muted-foreground">{group.label}</div>
          ) : null}
          {group.items.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex items-center gap-2.5 rounded-md px-2 transition-colors",
                  dense ? "py-1.5" : "py-2.5",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-foreground/80 hover:bg-accent hover:text-accent-foreground",
                ].join(" ")}
              >
                <Icon className="h-4 w-4 shrink-0 stroke-[1.75]" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function OpenSourceCard() {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/[0.06] p-3">
      <p className="text-[13px] font-medium text-foreground">Free and open source</p>
      <p className="mt-0.5 text-xs text-foreground/70">
        Found a bug or have an idea? Open an issue on GitHub.
      </p>
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2.5 inline-flex items-center gap-1 rounded text-xs font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
      >
        View on GitHub
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </a>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("offervia:flash") === "login") {
        sessionStorage.removeItem("offervia:flash");
        toast({
          title: "Signed in",
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
      title: "Signed out",
      variant: "default",
    });

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-background/80 backdrop-blur" />
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
              <span className="sr-only">Open menu</span>
            </Button>
            <Link
              href="/dashboard"
              className="flex items-center transition-opacity hover:opacity-90"
              aria-label="Offervia dashboard"
            >
              <BrandLogo width={132} height={32} priority className="h-7 sm:h-8" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <GlobalCommandMenu />
            <UserMenu onSignOut={onSignOut} />
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
            <div className="sticky top-20 rounded-2xl border border-border bg-card p-3 shadow-xs">
              <NavList pathname={pathname} dense />

              <div className="mt-4 border-t border-border pt-3">
                <OpenSourceCard />
              </div>
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
                    <span className="text-base font-semibold">Menu</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close menu</span>
                    </Button>
                  </div>
                  
                  <div className="overflow-y-auto p-4" style={{ maxHeight: "calc(100dvh - 3.5rem)" }}>
                    <NavList pathname={pathname} onNavigate={() => setSidebarOpen(false)} />

                    <div className="mt-4 border-t border-border pt-4">
                      <OpenSourceCard />
                    </div>
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Page content */}
          <main className="min-w-0 flex-1 w-full">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xs">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}

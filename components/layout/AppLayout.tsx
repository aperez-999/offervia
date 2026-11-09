"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import BrandLogo from "@/components/brand/BrandLogo";
import { usePathname, useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { List, X } from "@phosphor-icons/react/dist/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import UserMenu from "@/components/layout/UserMenu";
import Footer from "@/components/public/Footer";
import PageTransition from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { SECTIONS, sectionFor } from "@/lib/nav";
import SectionTabs from "@/components/layout/SectionTabs";

const GlobalCommandMenu = dynamic(() => import("@/components/layout/GlobalCommandMenu"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="h-8 w-[3.75rem] rounded-md border border-border bg-background/70"
    />
  ),
});

function NavList({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  const current = sectionFor(pathname)?.section.id;
  return (
    <nav aria-label="Main" className="space-y-0.5 text-sm">
      {SECTIONS.map((section) => {
        const active = section.id === current;
        const Icon = section.icon;
        return (
          <Link
            key={section.id}
            href={section.tabs[0].href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={[
              "group flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active
                ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                : "text-foreground/80 hover:bg-sidebar-accent/60 hover:text-foreground",
            ].join(" ")}
          >
            <Icon
              className="size-5 shrink-0 transition-transform duration-200 ease-[var(--ease-out-quint)] group-hover:scale-105"
              weight={active ? "fill" : "duotone"}
              aria-hidden
            />
            <span className="truncate">{section.label}</span>
          </Link>
        );
      })}
    </nav>
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
              <List className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
            <Link
              href="/dashboard"
              className="flex items-center transition-opacity hover:opacity-90"
              aria-label="Offervia dashboard"
            >
              <BrandLogo className="h-7 sm:h-8" />
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
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-20 rounded-2xl border border-border bg-card p-3 shadow-xs">
              <NavList pathname={pathname} />
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
                  className="fixed inset-0 z-50 bg-overlay lg:hidden"
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
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Page content */}
          <main className="min-w-0 flex-1 w-full">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xs">
              <SectionTabs pathname={pathname} />
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}

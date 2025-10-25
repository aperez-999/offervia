"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Search,
  MessageSquare,
  ClipboardList,
  BookOpen,
  GraduationCap,
  Mail,
  Rocket,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import UserMenu from "@/components/layout/UserMenu";
import GlobalCommandMenu from "@/components/layout/GlobalCommandMenu";
import Footer from "@/components/public/Footer";

type NavItem = { label: string; href: string; icon: React.ComponentType<any> };

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Resume", href: "/resume", icon: FileText },
  { label: "Scanner", href: "/scanner", icon: Search },
  { label: "Coach", href: "/coach", icon: MessageSquare },
  { label: "Tracker", href: "/tracker", icon: ClipboardList },
  { label: "Templates", href: "/templates", icon: Mail },
  { label: "Resources", href: "/resources", icon: BookOpen },
  { label: "Student Exclusives", href: "/students", icon: GraduationCap },
  { label: "Coming Soon", href: "/upcoming", icon: Rocket },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

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
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight">Offervia</span>
          </div>

          <div className="flex items-center gap-2">
            <GlobalCommandMenu />
            <UserMenu onSignOut={onSignOut} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex-1 w-full">
        <div className="flex gap-6 py-6">
          {/* Sidebar */}
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

          {/* Page content */}
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

      <Footer />
    </div>
  );
}
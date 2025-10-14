"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { LayoutDashboard, FileText, Search, MessageSquare, ClipboardList } from "lucide-react";

type NavItem = { label: string; href: string; icon: React.ComponentType<any> };
const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Resume", href: "/resume", icon: FileText },
  { label: "Scanner", href: "/scanner", icon: Search },
  { label: "Coach", href: "/coach", icon: MessageSquare },
  { label: "Tracker", href: "/tracker", icon: ClipboardList },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function onSignOut() {
    const supabase = getBrowserSupabase();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight">Offervia</span>
          </div>
          <div>
            {/* Sign Out button */}
            <button onClick={onSignOut} className="cursor-pointer inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-1 focus-visible:ring-offset-white">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Shell */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6 py-6">
          {/* Sidebar */}
          <aside className="w-56 shrink-0">
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">NAVIGATION</div>
              <div className="border-t border-gray-200 mb-2" />
              <nav className="space-y-1 text-sm text-gray-700">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 border focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-1 focus-visible:ring-offset-white ${
                        active
                          ? "border-gray-300 bg-gray-50 font-medium"
                          : "border-transparent hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="h-5 w-5 stroke-[1.5]" />
                      <span className={`truncate ${active ? "font-medium" : ""}`}>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

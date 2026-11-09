import {
  Briefcase,
  ChatsCircle,
  FileText,
  GraduationCap,
  House,
  PlusCircle,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

/**
 * The signed-in app in one place: six sections, each with one or more tabs.
 * The sidebar shows sections, a tab bar shows the tabs, and the command menu
 * lists every tab. Routes are the pages under app/(protected).
 */

export type NavTab = { label: string; href: string; description: string };
export type NavSection = { id: string; label: string; icon: Icon; tabs: NavTab[] };

export const SECTIONS: NavSection[] = [
  {
    id: "home",
    label: "Home",
    icon: House,
    tabs: [
      { label: "Overview", href: "/dashboard", description: "What needs your attention" },
      { label: "Insights", href: "/dashboard/insights", description: "How your search is going" },
    ],
  },
  {
    id: "apply",
    label: "New application",
    icon: PlusCircle,
    tabs: [{ label: "New application", href: "/job-packet", description: "Scan, tailor, and track one job" }],
  },
  {
    id: "write",
    label: "Resume & letters",
    icon: FileText,
    tabs: [
      { label: "Tailor", href: "/resume", description: "Fit your resume to a job" },
      { label: "Keyword scan", href: "/scanner", description: "Compare your resume to a posting" },
      { label: "Bullet check", href: "/bullet-check", description: "Tighten your resume bullets" },
      { label: "Cover letter", href: "/cover-letter", description: "Write a letter for a job" },
      { label: "Saved", href: "/documents", description: "Resumes and letters you've kept" },
    ],
  },
  {
    id: "practice",
    label: "Interview prep",
    icon: ChatsCircle,
    tabs: [
      { label: "Mock interview", href: "/interview", description: "Answer questions and get notes" },
      { label: "Ask a coach", href: "/coach", description: "Quick questions about your search" },
    ],
  },
  {
    id: "applications",
    label: "Applications",
    icon: Briefcase,
    tabs: [
      { label: "Tracker", href: "/tracker", description: "Every job and where it stands" },
      { label: "Compare offers", href: "/offers", description: "Offers side by side" },
    ],
  },
  {
    id: "hub",
    label: "Student Hub",
    icon: GraduationCap,
    tabs: [{ label: "Student Hub", href: "/student-hub", description: "Templates, deals, and resources" }],
  },
];

/** Pages that live in the user menu instead of the sidebar. */
export const ACCOUNT_PAGES: NavTab[] = [
  { label: "Profile", href: "/profile", description: "Your details and My resume" },
  { label: "Settings", href: "/settings", description: "Theme, preferences, and data" },
];

function matches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The section and tab for a path. Picks the most specific tab, so /dashboard/insights is Insights. */
export function sectionFor(pathname: string | null | undefined): { section: NavSection; tab: NavTab } | null {
  if (!pathname) return null;
  const path = pathname.split(/[?#]/)[0];
  let best: { section: NavSection; tab: NavTab } | null = null;
  for (const section of SECTIONS) {
    for (const tab of section.tabs) {
      if (matches(path, tab.href) && (!best || tab.href.length > best.tab.href.length)) {
        best = { section, tab };
      }
    }
  }
  return best;
}

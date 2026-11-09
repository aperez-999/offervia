import Link from "next/link";
import { sectionFor } from "@/lib/nav";

/**
 * Tabs for the current section (for example Tailor · Keyword scan · Bullet
 * check under "Resume & letters"). Renders nothing for single-page sections.
 */
export default function SectionTabs({ pathname }: { pathname: string | null }) {
  const found = sectionFor(pathname);
  if (!found || found.section.tabs.length < 2) return null;
  const { section, tab: activeTab } = found;

  return (
    <nav aria-label={section.label} className="-mx-4 mb-2 border-b border-border px-4 sm:-mx-6 sm:px-6">
      <ul className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {section.tabs.map((tab) => {
          const active = tab.href === activeTab.href;
          return (
            <li key={tab.href} className="shrink-0">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "relative inline-flex h-11 items-center px-3 text-sm transition-colors duration-200",
                  "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-center after:rounded-full after:bg-primary after:transition-transform after:duration-200 after:ease-[var(--ease-out-quint)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  active
                    ? "font-semibold text-foreground after:scale-x-100"
                    : "text-muted-foreground after:scale-x-0 hover:text-foreground",
                ].join(" ")}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

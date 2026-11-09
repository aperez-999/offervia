import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import path from "node:path";
import { ACCOUNT_PAGES, SECTIONS, sectionFor } from "@/lib/nav";

describe("sectionFor", () => {
  it("picks the most specific tab", () => {
    expect(sectionFor("/dashboard")?.tab.label).toBe("Overview");
    expect(sectionFor("/dashboard/insights")?.tab.label).toBe("Insights");
  });

  it("handles detail pages and query strings", () => {
    expect(sectionFor("/tracker/123")?.section.id).toBe("applications");
    expect(sectionFor("/student-hub?tab=deals")?.section.id).toBe("hub");
    expect(sectionFor("/scanner")?.section.label).toBe("Resume & letters");
  });

  it("does not match on a shared prefix", () => {
    expect(sectionFor("/resume-old")).toBeNull();
    expect(sectionFor(null)).toBeNull();
  });
});

describe("SECTIONS", () => {
  it("has six sections", () => {
    expect(SECTIONS.map((s) => s.label)).toEqual([
      "Home",
      "New application",
      "Resume & letters",
      "Interview prep",
      "Applications",
      "Student Hub",
    ]);
  });

  it("reaches every page folder under app/(protected)", () => {
    const dir = path.join(process.cwd(), "app", "(protected)");
    const folders = readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => `/${d.name}`);
    const known = [...SECTIONS.flatMap((s) => s.tabs), ...ACCOUNT_PAGES].map((t) => t.href);
    for (const folder of folders) {
      expect(known.some((href) => href === folder || href.startsWith(`${folder}/`))).toBe(true);
    }
  });
});

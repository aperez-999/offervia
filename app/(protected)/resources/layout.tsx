import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Resources",
  description: "Browse curated learning, practice, and career resources that support the rest of your job search workflow.",
  path: "/resources",
  index: false,
});

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

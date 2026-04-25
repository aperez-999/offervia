import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Templates",
  description: "Use curated outreach, follow-up, and interview message templates without leaving Offervia.",
  path: "/templates",
  index: false,
});

export default function TemplatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

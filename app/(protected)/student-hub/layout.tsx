import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Student Hub",
  description:
    "Message templates, curated learning resources, and verified student-only deals — organized in one place.",
  path: "/student-hub",
  index: false,
});

export default function StudentHubLayout({ children }: { children: React.ReactNode }) {
  return children;
}

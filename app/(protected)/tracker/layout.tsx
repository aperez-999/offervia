import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Application Tracker",
  description: "Track applications, follow-ups, and status changes in one organized view.",
  path: "/tracker",
  index: false,
});

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return children;
}

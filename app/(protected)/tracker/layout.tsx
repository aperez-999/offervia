import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Job Tracker",
  description: "Log the jobs you apply to and update each status as you hear back.",
  path: "/tracker",
  index: false,
});

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return children;
}

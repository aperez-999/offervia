import type { Metadata } from "next";
import CoachHub from "@/components/coach/CoachHub";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "AI Coach",
  description: "Practice interviews, refine messaging, and get focused job-search guidance without leaving your workflow.",
  path: "/coach",
  index: false,
});

export default function CoachPage() {
  return <CoachHub />;
}

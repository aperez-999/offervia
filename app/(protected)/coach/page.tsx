import type { Metadata } from "next";
import CoachHub from "@/components/coach/CoachHub";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "AI Coach",
  description: "Chat about interview answers, outreach messages, and job-search questions.",
  path: "/coach",
  index: false,
});

export default function CoachPage() {
  return <CoachHub />;
}

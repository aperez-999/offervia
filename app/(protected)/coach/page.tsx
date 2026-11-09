import type { Metadata } from "next";
import CoachHub from "@/components/coach/CoachHub";
import { createPageMetadata } from "@/lib/metadata";
import { readAllowanceForCurrentUser } from "@/lib/usage/featureGate";

export const metadata: Metadata = createPageMetadata({
  title: "Ask a coach",
  description: "Quick questions about interview answers, resume bullets, and your search.",
  path: "/coach",
  index: false,
});

export default async function CoachPage() {
  const allowance = await readAllowanceForCurrentUser("coach");
  return <CoachHub allowance={allowance} />;
}

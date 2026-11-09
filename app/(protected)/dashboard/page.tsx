import { redirect } from "next/navigation";
import { getUsageSnapshot } from "@/lib/usage/read";
import DashboardClient from "./DashboardClient";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import { getCurrentUser } from "@/lib/auth/session";
import { readSavedResumeForCurrentUser } from "@/lib/profile/resume-server";

export const metadata: Metadata = createPageMetadata({
  title: "Home",
  description: "What needs your attention in your job search.",
  path: "/dashboard",
  index: false,
});

export default async function DashboardPage() {
  const { user, error: authError } = await getCurrentUser();

  if (authError || !user?.id) {
    redirect("/login");
  }

  const [usage, savedResume] = await Promise.all([
    getUsageSnapshot(user.id),
    readSavedResumeForCurrentUser(),
  ]);

  return <DashboardClient usage={usage} hasSavedResume={Boolean(savedResume)} />;
}

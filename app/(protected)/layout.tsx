import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { getCurrentUser, getCurrentUserSubscription } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: {
    default: "Workspace",
    template: "%s | Offervia",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, error: authError } = await getCurrentUser();

  if (authError || !user?.id) {
    redirect("/login");
  }

  const subscription = await getCurrentUserSubscription(user.id);
  const plan = subscription.plan;

  return <AppLayout plan={plan}>{children}</AppLayout>;
}

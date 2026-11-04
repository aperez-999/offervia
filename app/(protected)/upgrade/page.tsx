import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserSubscription } from "@/lib/subscription";
import UpgradeClient from "@/app/(protected)/upgrade/UpgradeClient";
import { createSupabaseServerClient } from "@/lib/supabase/ssr";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Upgrade",
  description: "Compare the Free and Pro plans. Pro costs $10 a month and raises your monthly limits.",
  path: "/upgrade",
  index: false,
});

export default async function UpgradePage() {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient({
    get(name: string) {
      return cookieStore.get(name)?.value;
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    redirect("/login");
  }

  const subscription = await getUserSubscription(user.id);
  const plan = subscription.plan;

  return (
    <div className="py-6 sm:py-8">
      <UpgradeClient plan={plan} />
    </div>
  );
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserSubscription } from "@/lib/subscription";
import UpgradeClient from "@/app/(protected)/upgrade/UpgradeClient";
import { createSupabaseServerClient } from "@/lib/supabase/ssr";

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

  return <UpgradeClient plan={plan} />;
}

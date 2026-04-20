import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { getUserSubscription } from "@/lib/subscription";
import { createSupabaseServerClient } from "@/lib/supabase/ssr";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return <AppLayout plan={plan}>{children}</AppLayout>;
}
import { getServerSupabase } from "@/lib/supabase/server"

export type UserSubscription = {
  plan: "free" | "pro"
  status: string
  currentPeriodEnd: string | null
}

export async function getUserSubscription(
  userId: string
): Promise<UserSubscription> {
  const supabase = getServerSupabase()

  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("user_id", userId)
    .single()

  if (error || !data) {
    // No subscription record → default to free
    return {
      plan: "free",
      status: "inactive",
      currentPeriodEnd: null,
    }
  }

  return {
    plan: (data.plan as "free" | "pro") ?? "free",
    status: data.status ?? "inactive",
    currentPeriodEnd: data.current_period_end,
  }
}

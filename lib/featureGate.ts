import { getUserSubscription } from "@/lib/subscription"
import { getPlanLimits } from "@/lib/plans"
import { getServiceSupabase } from "@/lib/supabase/service"

export type GatedFeature = "resume_tailor" | "coach" | "job_scan"

export type FeatureGateResult =
  | { allowed: true }
  | { allowed: false; reason: "PLAN_LIMIT_REACHED" }

const FEATURE_TO_LIMIT_KEY: Record<
  GatedFeature,
  "resume_tailor_per_month" | "coach_messages_per_month" | "job_scans_per_month"
> = {
  resume_tailor: "resume_tailor_per_month",
  coach: "coach_messages_per_month",
  job_scan: "job_scans_per_month",
}

const FEATURE_TO_COLUMN: Record<
  GatedFeature,
  "resume_tailor_count" | "coach_message_count" | "job_scan_count"
> = {
  resume_tailor: "resume_tailor_count",
  coach: "coach_message_count",
  job_scan: "job_scan_count",
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7)
}

export async function checkFeatureGate(
  userId: string,
  feature: GatedFeature
): Promise<FeatureGateResult> {
  const subscription = await getUserSubscription(userId)
  const planLimits = getPlanLimits(subscription.plan)
  const limitKey = FEATURE_TO_LIMIT_KEY[feature]
  const limit = planLimits[limitKey]

  const supabase = getServiceSupabase()
  const month = getCurrentMonth()

  const { data } = await supabase
    .from("usage_snapshots")
    .select("resume_tailor_count, coach_message_count, job_scan_count")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle()

  const column = FEATURE_TO_COLUMN[feature]
  const currentCount = (data?.[column] as number | undefined) ?? 0

  if (currentCount >= limit) {
    return { allowed: false, reason: "PLAN_LIMIT_REACHED" }
  }

  return { allowed: true }
}

import { getServiceSupabase } from "@/lib/supabase/service"
import {
  ALLOWANCE_WINDOW_MS,
  DAILY_LIMITS,
  allowanceKind,
  allowanceStatus,
  limitReachedMessage,
  toSnapshot,
  type AllowanceSnapshot,
  type GatedFeature,
} from "@/lib/usage/limits"
import { fail } from "@/lib/api/response"

export type { GatedFeature } from "@/lib/usage/limits"

export type FeatureGateResult =
  | { allowed: true }
  | { allowed: false; resetsAt: Date | null }

async function readUseTimes(userId: string, kinds: string[]) {
  const supabase = getServiceSupabase()
  const since = new Date(Date.now() - ALLOWANCE_WINDOW_MS).toISOString()
  const { data, error } = await supabase
    .from("request_events")
    .select("kind, created_at")
    .eq("user_id", userId)
    .in("kind", kinds)
    .gt("created_at", since)
  if (error) throw error
  return data ?? []
}

/**
 * Check the rolling 24-hour allowance before doing paid work. Pair with
 * recordDailyUse() after the work succeeds, so failures never count.
 */
export async function checkFeatureGate(
  userId: string,
  feature: GatedFeature
): Promise<FeatureGateResult> {
  const rows = await readUseTimes(userId, [allowanceKind(feature)])
  const status = allowanceStatus(
    rows.map((r) => r.created_at as string),
    DAILY_LIMITS[feature]
  )
  return status.remaining > 0 ? { allowed: true } : { allowed: false, resetsAt: status.resetsAt }
}

/** Record one successful use. Logging failures are swallowed on purpose. */
export async function recordDailyUse(userId: string, feature: GatedFeature) {
  const supabase = getServiceSupabase()
  await supabase.from("request_events").insert({ user_id: userId, kind: allowanceKind(feature) })
}

/** Today's status for one feature, for the note next to a tool's button. */
export async function readAllowance(userId: string, feature: GatedFeature): Promise<AllowanceSnapshot> {
  try {
    const rows = await readUseTimes(userId, [allowanceKind(feature)])
    return toSnapshot(allowanceStatus(rows.map((r) => r.created_at as string), DAILY_LIMITS[feature]))
  } catch {
    // Showing nothing is better than blocking the page; the API still enforces the limit.
    return { used: 0, remaining: DAILY_LIMITS[feature], limit: DAILY_LIMITS[feature], resetsAt: null }
  }
}

/**
 * The 429 response every AI route returns when a daily allowance is used up.
 * The message stays time-free because the server does not know the reader's
 * time zone; the browser rebuilds it from resetsAt (see lib/usage/client.ts).
 */
export function dailyLimitResponse(feature: GatedFeature, resetsAt: Date | null) {
  return fail("DAILY_LIMIT_REACHED", limitReachedMessage(feature, null), 429, {
    extra: { feature, resetsAt: resetsAt?.toISOString() ?? null },
  })
}

/** readAllowance for whoever is signed in. For server components. */
export async function readAllowanceForCurrentUser(feature: GatedFeature): Promise<AllowanceSnapshot | null> {
  const { getCurrentUser } = await import("@/lib/auth/session")
  const { user } = await getCurrentUser()
  return user?.id ? readAllowance(user.id, feature) : null
}

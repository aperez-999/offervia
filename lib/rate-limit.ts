import type { SupabaseClient } from "@supabase/supabase-js";

export type RateWindow = { ms: number; limit: number };
export type RateResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number; reason: string };

export function getIpUa(req: Request) {
  const h = new Headers(req.headers);
  const fwd = h.get("x-forwarded-for") || "";
  const ip = fwd.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  const ua = h.get("user-agent") || null;
  return { ip, ua };
}

/**
 * Checks recent counts in request_events and inserts a new row if allowed.
 * Keep it simple (no transactions) — good enough for beta.
 */
export async function enforceRateLimit(
  supabase: SupabaseClient,
  userId: string,
  kind: "coach" | "scanner" | "resume_tailor",
  options?: {
    windows?: RateWindow[]; // e.g. [{ ms: 60_000, limit: 10 }, { ms: 86_400_000, limit: 200 }]
    ip?: string | null;
    ua?: string | null;
  }
): Promise<RateResult> {
  const windows =
    options?.windows ??
    [
      { ms: 60_000, limit: 10 },       // 10/min
      { ms: 3_600_000, limit: 120 },   // 120/hour
      { ms: 86_400_000, limit: 400 },  // 400/day
    ];

  const now = Date.now();

  // Check each window
  for (const w of windows) {
    const cutoffIso = new Date(now - w.ms).toISOString();
    const { count, error } = await supabase
      .from("request_events")
      .select("*", { head: true, count: "exact" })
      .eq("user_id", userId)
      .eq("kind", kind)
      .gt("created_at", cutoffIso);

    if (error) {
      // If the table is briefly unavailable, fail closed to protect upstreams
      return { ok: false, retryAfterSeconds: Math.ceil(w.ms / 1000), reason: "db_error" };
    }
    if ((count ?? 0) >= w.limit) {
      return {
        ok: false,
        retryAfterSeconds: Math.ceil(w.ms / 1000),
        reason: "rate_limited",
      };
    }
  }

  // Allowed — record the event
  const { error: insErr } = await supabase.from("request_events").insert({
    user_id: userId,
    kind,
    ip: options?.ip ?? null,
    ua: options?.ua ?? null,
  });
  if (insErr) {
    // Don’t block the request if logging fails; just proceed
    // (You can flip this to fail-closed later if you prefer)
  }

  return { ok: true };
}
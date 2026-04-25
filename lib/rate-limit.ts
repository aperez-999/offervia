import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceSupabase } from "./supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/ssr";

export type RateWindow = { ms: number; limit: number };
export type RateLimitKind =
  | "coach"
  | "scanner"
  | "resume_tailor"
  | "job-scan"
  | "tracker_get"
  | "tracker_write"
  | "billing_checkout"
  | "billing_portal"
  | "contact"
  | "auth_login"
  | "auth_signup"
  | "auth_forgot_password"
  | "auth_oauth_start";
export type RateResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number; reason: string; allowed?: boolean; limitReached?: boolean };

export function getIpUa(req: Request) {
  const h = new Headers(req.headers);
  const forwarded =
    h.get("x-vercel-forwarded-for") ||
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for") ||
    "";
  const ip = forwarded.split(",")[0]?.trim() || null;
  const ua = h.get("user-agent") || null;
  return { ip, ua };
}

/**
 * Helper function for API routes that need rate limiting.
 * Gets the current user from request cookies, sets up Supabase, and enforces rate limits.
 */
export async function checkRateLimitForApi(
  req: Request,
  kind: "coach" | "scanner" | "resume_tailor" | "job-scan",
  customLimits?: {
    perMinute?: number;
    perHour?: number;
    perDay?: number;
  }
): Promise<RateResult & { userId?: string }> {
  try {
    // Read cookies from request headers
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies: Record<string, string> = {};
    cookieHeader.split(";").forEach((cookie) => {
      const [name, ...rest] = cookie.trim().split("=");
      if (name) {
        cookies[name] = rest.join("=");
      }
    });
    
    const supabaseAuth = createSupabaseServerClient({
      get(name: string) {
        return cookies[name];
      },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user || !user.id) {
      return { ok: false, retryAfterSeconds: 60, reason: "unauthorized", allowed: false };
    }

    const userId = user.id;
    const supabase = getServiceSupabase();
    const { ip, ua } = getIpUa(req);

    // Convert custom limits to windows format
    const windows: RateWindow[] = customLimits
      ? [
          ...(customLimits.perMinute ? [{ ms: 60_000, limit: customLimits.perMinute }] : []),
          ...(customLimits.perHour ? [{ ms: 3_600_000, limit: customLimits.perHour }] : []),
          ...(customLimits.perDay ? [{ ms: 86_400_000, limit: customLimits.perDay }] : []),
        ]
      : [];

    const result = await enforceRateLimit(supabase, userId, kind, {
      windows: windows.length > 0 ? windows : undefined,
      ip,
      ua,
    });

    return { ...result, userId };
  } catch (err) {
    console.error("Rate limit check failed:", err);
    // Fail closed for production safety
    return { ok: false, retryAfterSeconds: 60, reason: "error", allowed: false, limitReached: true };
  }
}

/**
 * Checks recent counts in request_events and inserts a new row if allowed.
 * Keep it simple (no transactions) — good enough for beta.
 */
export async function enforceRateLimit(
  supabase: SupabaseClient,
  userId: string,
  kind: RateLimitKind,
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

const IP_ONLY_SENTINEL = "00000000-0000-0000-0000-000000000000";

/** Rate limit when you already have userId (e.g. tracker Bearer, billing cookies). */
export async function checkRateLimitWithUserId(
  supabase: SupabaseClient,
  userId: string,
  kind: "tracker_get" | "tracker_write" | "billing_checkout" | "billing_portal",
  customLimits: { perMinute?: number; perDay?: number }
): Promise<RateResult> {
  const windows: RateWindow[] = [
    ...(customLimits.perMinute ? [{ ms: 60_000, limit: customLimits.perMinute }] : []),
    ...(customLimits.perDay ? [{ ms: 86_400_000, limit: customLimits.perDay }] : []),
  ];
  if (windows.length === 0) return { ok: true };
  return enforceRateLimit(supabase, userId, kind, { windows });
}

/** IP-only rate limit (e.g. contact form). Counts by kind + ip; inserts with sentinel user_id. */
export async function enforceRateLimitByIp(
  supabase: SupabaseClient,
  kind: "contact" | "auth_login" | "auth_signup" | "auth_forgot_password" | "auth_oauth_start",
  ip: string,
  windows: RateWindow[]
): Promise<RateResult> {
  const now = Date.now();

  for (const w of windows) {
    const cutoffIso = new Date(now - w.ms).toISOString();
    const { count, error } = await supabase
      .from("request_events")
      .select("*", { head: true, count: "exact" })
      .eq("kind", kind)
      .eq("ip", ip)
      .gt("created_at", cutoffIso);

    if (error) {
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

  const { error: insErr } = await supabase.from("request_events").insert({
    user_id: IP_ONLY_SENTINEL,
    kind,
    ip,
    ua: null,
  });
  if (insErr) {
    // Non-blocking
  }

  return { ok: true };
}

export async function checkRateLimitByIp(
  req: Request,
  kind: "contact" | "auth_login" | "auth_signup" | "auth_forgot_password" | "auth_oauth_start",
  windows: RateWindow[]
): Promise<RateResult> {
  const supabase = getServiceSupabase();
  const { ip } = getIpUa(req);
  return enforceRateLimitByIp(supabase, kind, ip || "unknown", windows);
}

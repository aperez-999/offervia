import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { fail } from "@/lib/api/response";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";
import { captureServerException } from "@/lib/monitoring/sentry";
import { checkRateLimitByIp } from "@/lib/rate-limit";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";

const loginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
    next: z.string().optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const rl = await checkRateLimitByIp(req, "auth_login", [
    { ms: 60_000, limit: 8 },
    { ms: 3_600_000, limit: 60 },
  ]);
  if (!rl.ok) {
    return fail("RATE_LIMITED", "Too many requests. Try again soon.", 429, {
      headers: { "Retry-After": String(rl.retryAfterSeconds ?? 60) },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("INVALID_INPUT", "Invalid request.", 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return fail("INVALID_INPUT", "Invalid request.", 400);
  }

  const { supabase, applyCookies } = createSupabaseRouteHandlerClient(req);
  const { email, password, next } = parsed.data;
  const safeNext = sanitizeRedirectPath(next, "/dashboard");

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return fail("UNAUTHORIZED", getAuthErrorMessage(error, "login"), 401);
    }

    return applyCookies(
      NextResponse.json({
        success: true,
        data: { next: safeNext },
      })
    );
  } catch (error) {
    captureServerException(error, { route: "api/auth/login" });
    return fail("SERVER_ERROR", "We couldn't sign you in. Please try again.", 500);
  }
}

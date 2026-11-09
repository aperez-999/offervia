import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { fail } from "@/lib/api/response";
import { getAuthErrorMessage, isObfuscatedExistingSignupResponse } from "@/lib/auth/errors";
import { buildAuthCallbackUrl, sanitizeRedirectPath } from "@/lib/auth/redirect";
import { captureServerException } from "@/lib/monitoring/sentry";
import { checkRateLimitByIp } from "@/lib/rate-limit";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";

const signupSchema = z
  .object({
    name: z.string().min(1).max(120),
    email: z.string().email(),
    password: z.string().min(8),
    next: z.string().optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const rl = await checkRateLimitByIp(req, "auth_signup", [
    { ms: 60_000, limit: 5 },
    { ms: 3_600_000, limit: 30 },
  ]);
  if (!rl.ok) {
    return fail("RATE_LIMITED", "Too many requests. Wait a minute and try again.", 429, {
      headers: { "Retry-After": String(rl.retryAfterSeconds ?? 60) },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("INVALID_INPUT", "That request wasn't valid. Refresh the page and try again.", 400);
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return fail("INVALID_INPUT", "That request wasn't valid. Refresh the page and try again.", 400);
  }

  const safeNext = sanitizeRedirectPath(parsed.data.next, "/dashboard");
  const origin = req.nextUrl.origin;
  const emailRedirectTo = buildAuthCallbackUrl(origin, safeNext);

  const { supabase, applyCookies } = createSupabaseRouteHandlerClient(req);

  try {
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo,
        data: { full_name: parsed.data.name },
      },
    });

    if (error) {
      return fail("BAD_REQUEST", getAuthErrorMessage(error, "signup"), 400);
    }

    if (isObfuscatedExistingSignupResponse(data)) {
      return fail("BAD_REQUEST", "An account with that email already exists.", 400);
    }

    return applyCookies(
      NextResponse.json({
        success: true,
        data: {
          next: safeNext,
          message: "Account created. Check your email to confirm your account.",
        },
      })
    );
  } catch (error) {
    captureServerException(error, { route: "api/auth/signup" });
    return fail("SERVER_ERROR", "We couldn't create your account. Try again.", 500);
  }
}

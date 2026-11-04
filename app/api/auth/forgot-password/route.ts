import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { fail } from "@/lib/api/response";
import { publicEnv } from "@/lib/env/public";
import { captureServerException } from "@/lib/monitoring/sentry";
import { checkRateLimitByIp } from "@/lib/rate-limit";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";

const forgotPasswordSchema = z
  .object({
    email: z.string().email(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const rl = await checkRateLimitByIp(req, "auth_forgot_password", [
    { ms: 60_000, limit: 4 },
    { ms: 3_600_000, limit: 20 },
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

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return fail("INVALID_INPUT", "That request wasn't valid. Refresh the page and try again.", 400);
  }

  const origin = publicEnv.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || new URL(req.url).origin;
  const redirectTo = `${origin}/reset-password`;

  const { supabase, applyCookies } = createSupabaseRouteHandlerClient(req);

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo,
    });

    if (error) {
      captureServerException(error, { route: "api/auth/forgot-password" });
    }

    return applyCookies(
      NextResponse.json({
        success: true,
        data: {
          message: "If that email is registered, a reset link has been sent.",
        },
      })
    );
  } catch (error) {
    captureServerException(error, { route: "api/auth/forgot-password" });
    return fail("SERVER_ERROR", "We couldn't send a reset email. Try again in a few minutes.", 500);
  }
}

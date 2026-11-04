import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { fail } from "@/lib/api/response";
import { buildAuthCallbackUrl, OAUTH_NEXT_COOKIE, sanitizeRedirectPath } from "@/lib/auth/redirect";
import { captureServerException } from "@/lib/monitoring/sentry";
import { checkRateLimitByIp } from "@/lib/rate-limit";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";

const oauthProviderSchema = z.enum(["google", "linkedin_oidc"]);
const oauthStartSchema = z
  .object({
    provider: oauthProviderSchema,
    next: z.string().optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const rl = await checkRateLimitByIp(req, "auth_oauth_start", [
    { ms: 60_000, limit: 10 },
    { ms: 3_600_000, limit: 50 },
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

  const parsed = oauthStartSchema.safeParse(body);
  if (!parsed.success) {
    return fail("INVALID_INPUT", "That request wasn't valid. Refresh the page and try again.", 400);
  }

  const safeNext = sanitizeRedirectPath(parsed.data.next, "/dashboard");
  const origin = req.nextUrl.origin;
  const redirectTo = buildAuthCallbackUrl(origin, safeNext);
  const { supabase, applyCookies } = createSupabaseRouteHandlerClient(req);

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: parsed.data.provider,
      options: {
        redirectTo,
        queryParams:
          parsed.data.provider === "google"
            ? { access_type: "offline", prompt: "consent" }
            : undefined,
      },
    });

    if (error || !data.url) {
      return fail("BAD_REQUEST", "We couldn't finish signing you in. Try again.", 400);
    }

    const response = applyCookies(
      NextResponse.json({
        success: true,
        data: { url: data.url },
      })
    );

    response.cookies.set(OAUTH_NEXT_COOKIE, safeNext, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch (error) {
    captureServerException(error, { route: "api/auth/oauth/start" });
    return fail("SERVER_ERROR", "We couldn't finish signing you in. Try again.", 500);
  }
}

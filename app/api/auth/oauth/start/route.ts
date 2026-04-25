import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/api/response";
import { buildAuthCallbackUrl, sanitizeRedirectPath } from "@/lib/auth/redirect";
import { publicEnv } from "@/lib/env/public";
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

  const parsed = oauthStartSchema.safeParse(body);
  if (!parsed.success) {
    return fail("INVALID_INPUT", "Invalid request.", 400);
  }

  const safeNext = sanitizeRedirectPath(parsed.data.next, "/dashboard?login=1");
  const origin = publicEnv.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || new URL(req.url).origin;
  const redirectTo = buildAuthCallbackUrl(origin, safeNext);
  const { supabase } = createSupabaseRouteHandlerClient(req);

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
      return fail("BAD_REQUEST", "We couldn't continue the sign-in flow. Please try again.", 400);
    }

    return ok({ url: data.url });
  } catch (error) {
    captureServerException(error, { route: "api/auth/oauth/start" });
    return fail("SERVER_ERROR", "We couldn't continue the sign-in flow. Please try again.", 500);
  }
}

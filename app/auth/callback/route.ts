import { NextRequest, NextResponse } from "next/server";

import { sanitizeRedirectPath } from "@/lib/auth/redirect";
import { captureServerException } from "@/lib/monitoring/sentry";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";

function redirectWithCookies(
  req: NextRequest,
  path: string,
  applyCookies: (response: NextResponse) => NextResponse
) {
  const url = new URL(path, req.url);
  return applyCookies(NextResponse.redirect(url));
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const safeNext = sanitizeRedirectPath(searchParams.get("next"), "/dashboard?login=1");
  const { supabase, applyCookies } = createSupabaseRouteHandlerClient(req);

  if (error || !code) {
    return redirectWithCookies(req, "/login?auth_error=oauth_callback_failed", applyCookies);
  }

  try {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      captureServerException(exchangeError, { route: "auth/callback" });
      return redirectWithCookies(req, "/login?auth_error=oauth_callback_failed", applyCookies);
    }

    return redirectWithCookies(req, safeNext, applyCookies);
  } catch (caught) {
    captureServerException(caught, { route: "auth/callback" });
    return redirectWithCookies(req, "/login?auth_error=oauth_callback_failed", applyCookies);
  }
}

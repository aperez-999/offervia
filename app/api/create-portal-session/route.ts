import stripe from "@/lib/stripe";
import { getServiceSupabase } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/ssr";
import { serverEnv } from "@/lib/env/server";
import { fail } from "@/lib/api/response";
import { captureServerException } from "@/lib/monitoring/sentry";

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name) cookies[name] = rest.join("=").trim();
  });
  return cookies;
}

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = parseCookies(cookieHeader);

    const supabase = createSupabaseServerClient({
      get(name: string) {
        return cookies[name];
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return fail("UNAUTHORIZED", "Sign in to continue.", 401);
    }

    const { checkRateLimitWithUserId } = await import("@/lib/rate-limit");
    const serviceSupabase = getServiceSupabase();
    const rl = await checkRateLimitWithUserId(serviceSupabase, user.id, "billing_portal", {
      perMinute: 10,
      perDay: 50,
    });
    if (!rl.ok) {
      return fail("RATE_LIMITED", "Too many requests. Wait a minute and try again.", 429);
    }
    const { data: sub } = await serviceSupabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const stripeCustomerId = sub?.stripe_customer_id;
    if (!stripeCustomerId || typeof stripeCustomerId !== "string") {
      return fail("BAD_REQUEST", "You don't have an active subscription to manage.", 400);
    }

    const siteUrl = serverEnv.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
    if (!siteUrl) {
      return fail("SERVER_ERROR", "Couldn't open billing. Try again in a moment.", 500);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${siteUrl}/dashboard`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    captureServerException(err, { route: "api/create-portal-session" });
    console.error("[billing-session]", err);
    // Stripe's Customer Portal must be activated once per mode (test/live) in
    // the dashboard. Until then Stripe throws a config error — surface a clear
    // message instead of a generic 500 so the cause is obvious.
    const message =
      err instanceof Error && /configuration|portal/i.test(err.message)
        ? "Billing portal isn't set up yet. Activate the Customer Portal in your Stripe dashboard, then try again."
        : "Couldn't open billing. Try again in a moment.";
    return fail("SERVER_ERROR", message, 500);
  }
}

import stripe from "@/lib/stripe";
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
      return fail("UNAUTHORIZED", "Authentication required.", 401);
    }

    const { checkRateLimitWithUserId } = await import("@/lib/rate-limit");
    const { getServiceSupabase } = await import("@/lib/supabase/service");
    const serviceSupabase = getServiceSupabase();
    const rl = await checkRateLimitWithUserId(serviceSupabase, user.id, "billing_checkout", {
      perMinute: 10,
      perDay: 50,
    });
    if (!rl.ok) {
      return fail("RATE_LIMITED", "Too many requests. Try again soon.", 429);
    }

    const priceId = serverEnv.NEXT_PUBLIC_STRIPE_PRICE_ID;
    const siteUrl = serverEnv.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");

    if (!priceId || !siteUrl) {
      return fail("SERVER_ERROR", "Unable to start billing session.", 500);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        { price: priceId, quantity: 1 },
      ],
      success_url: `${siteUrl}/dashboard?upgrade=success`,
      cancel_url: `${siteUrl}/dashboard?upgrade=cancel`,
      customer_email: user.email ?? undefined,
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
      metadata: {
        userId: user.id,
      },
    });

    return Response.json({ url: session.url });
  } catch (err) {
    captureServerException(err, { route: "api/create-checkout-session" });
    console.error("[billing-session]", err);
    return fail("SERVER_ERROR", "Unable to start billing session.", 500);
  }
}

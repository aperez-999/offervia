import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import stripe from "@/lib/stripe";
import { getServiceSupabase } from "@/lib/supabase/service";

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

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookies[name];
          },
          set() {},
          remove() {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentication required." },
        { status: 401 }
      );
    }

    const { checkRateLimitWithUserId } = await import("@/lib/rate-limit");
    const serviceSupabase = getServiceSupabase();
    const rl = await checkRateLimitWithUserId(serviceSupabase, user.id, "billing_portal", {
      perMinute: 10,
      perDay: 50,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Too many requests. Try again soon." },
        { status: 429 }
      );
    }
    const { data: sub } = await serviceSupabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const stripeCustomerId = sub?.stripe_customer_id;
    if (!stripeCustomerId || typeof stripeCustomerId !== "string") {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "No active subscription found." },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
    if (!siteUrl) {
      return NextResponse.json(
        { error: "SERVER_ERROR", message: "Unable to start billing session." },
        { status: 500 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${siteUrl}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing-session]", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Unable to start billing session." },
      { status: 500 }
    );
  }
}

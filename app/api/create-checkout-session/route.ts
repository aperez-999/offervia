import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import stripe from "@/lib/stripe";

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
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");

    if (!priceId || !siteUrl) {
      return NextResponse.json(
        { error: "Checkout is not configured" },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        { price: priceId, quantity: 1 },
      ],
      success_url: `${siteUrl}/dashboard?upgrade=success`,
      cancel_url: `${siteUrl}/dashboard?upgrade=cancel`,
      customer_email: user.email ?? undefined,
      metadata: {
        userId: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create checkout session";
    console.error("Create checkout session error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

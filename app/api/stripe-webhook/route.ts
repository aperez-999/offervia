import { NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { getServiceSupabase } from "@/lib/supabase/service";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Stripe webhook: STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (e) {
    console.error("Stripe webhook: failed to read body", e);
    return NextResponse.json(
      { error: "Invalid body" },
      { status: 400 }
    );
  }

  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("Stripe webhook: signature verification failed", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        if (!userId || !subscriptionId) {
          console.warn("Stripe webhook: checkout.session.completed missing userId or subscription id", {
            userId,
            subscriptionId,
          });
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const periodEnd = (subscription as { current_period_end?: number })
          .current_period_end;
        const currentPeriodEnd = periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null;

        await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId ?? null,
            stripe_subscription_id: subscriptionId,
            plan: "pro",
            status: "active",
            current_period_end: currentPeriodEnd,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stripe_subscription_id" }
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubscriptionId = subscription.id;

        await supabase
          .from("subscriptions")
          .update({
            plan: "free",
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", stripeSubscriptionId);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("Stripe webhook: handler error", event.type, err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

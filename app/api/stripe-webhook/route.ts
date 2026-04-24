import { NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import { getServiceSupabase } from "@/lib/supabase/service";
import type Stripe from "stripe";
import { serverEnv } from "@/lib/env/server";
import { fail } from "@/lib/api/response";
import { captureServerException } from "@/lib/monitoring/sentry";

function isoFromUnixSeconds(seconds: number | null | undefined) {
  if (!seconds || typeof seconds !== "number") return null;
  const ms = seconds * 1000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function getCurrentPeriodEndIso(subscriptionLike: unknown) {
  const seconds =
    typeof subscriptionLike === "object" &&
    subscriptionLike !== null &&
    "current_period_end" in subscriptionLike &&
    typeof (subscriptionLike as { current_period_end?: unknown }).current_period_end === "number"
      ? ((subscriptionLike as { current_period_end: number }).current_period_end as number)
      : undefined;
  return isoFromUnixSeconds(seconds);
}

function getInvoiceSubscriptionId(invoiceLike: unknown): string | null {
  if (!invoiceLike || typeof invoiceLike !== "object") return null;
  if (!("subscription" in invoiceLike)) return null;
  const sub = (invoiceLike as { subscription?: unknown }).subscription;
  if (typeof sub === "string") return sub;
  if (sub && typeof sub === "object" && "id" in sub && typeof (sub as { id?: unknown }).id === "string") {
    return (sub as { id: string }).id;
  }
  return null;
}

export async function POST(req: Request) {
  const secret = serverEnv.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Stripe webhook: STRIPE_WEBHOOK_SECRET is not set");
    return fail("SERVER_ERROR", "Webhook not configured", 500);
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (e) {
    console.error("Stripe webhook: failed to read body", e);
    return fail("INVALID_INPUT", "Invalid body", 400);
  }

  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("Stripe webhook: signature verification failed", err);
    return fail("INVALID_INPUT", "Invalid signature", 400);
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

        const subscriptionRes = await stripe.subscriptions.retrieve(subscriptionId);
        const currentPeriodEnd = getCurrentPeriodEndIso(subscriptionRes);

        await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId ?? null,
            stripe_subscription_id: subscriptionId,
            plan: "pro",
            status:
              typeof subscriptionRes === "object" &&
              subscriptionRes !== null &&
              "status" in subscriptionRes &&
              typeof (subscriptionRes as { status?: unknown }).status === "string"
                ? ((subscriptionRes as { status: string }).status as string)
                : "active",
            current_period_end: currentPeriodEnd,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stripe_subscription_id" }
        );
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as unknown;
        const stripeSubscriptionId =
          typeof subscription === "object" &&
          subscription !== null &&
          "id" in subscription &&
          typeof (subscription as { id?: unknown }).id === "string"
            ? ((subscription as { id: string }).id as string)
            : null;
        if (!stripeSubscriptionId) break;

        // If we already have a subscription row, update it (idempotent).
        // If we don't, we can't safely map this subscription to a user without metadata.
        const currentPeriodEnd = getCurrentPeriodEndIso(subscription);

        // If a subscription is canceled/unpaid, drop to free. Otherwise keep pro.
        const status =
          typeof subscription === "object" &&
          subscription !== null &&
          "status" in subscription &&
          typeof (subscription as { status?: unknown }).status === "string"
            ? ((subscription as { status: string }).status as string)
            : "inactive";
        const isActiveLike = ["active", "trialing", "past_due"].includes(status);
        const nextPlan = isActiveLike ? "pro" : "free";

        await supabase
          .from("subscriptions")
          .update({
            plan: nextPlan,
            status,
            current_period_end: currentPeriodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", stripeSubscriptionId);

        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as unknown;
        const stripeSubscriptionId = getInvoiceSubscriptionId(invoice);
        if (!stripeSubscriptionId) break;

        await supabase
          .from("subscriptions")
          .update({
            plan: "pro",
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", stripeSubscriptionId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown;
        const stripeSubscriptionId = getInvoiceSubscriptionId(invoice);
        if (!stripeSubscriptionId) break;

        await supabase
          .from("subscriptions")
          .update({
            // keep pro but mark past_due so the app can decide what to do
            plan: "pro",
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", stripeSubscriptionId);
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
    captureServerException(err, {
      route: "api/stripe-webhook",
      extras: { eventType: event.type },
    });
    console.error("Stripe webhook: handler error", event.type, err);
    return fail("SERVER_ERROR", "Webhook handler failed", 500);
  }

  return NextResponse.json({ received: true });
}

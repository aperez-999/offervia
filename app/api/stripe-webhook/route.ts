import { NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import type Stripe from "stripe";
import { serverEnv } from "@/lib/env/server";
import { fail } from "@/lib/api/response";
import { captureServerException } from "@/lib/monitoring/sentry";
import {
  derivePlanFromSubscriptionStatus,
  getInvoiceSubscriptionId,
  syncSubscriptionFromCheckoutSession,
  toCurrentPeriodEndIso,
  upsertSubscriptionRecord,
} from "@/lib/billing/subscription-sync";

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

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.id) {
          console.warn("Stripe webhook: checkout.session.completed missing session id");
          break;
        }
        await syncSubscriptionFromCheckoutSession({ sessionId: session.id });
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
        const status =
          typeof subscription === "object" &&
          subscription !== null &&
          "status" in subscription &&
          typeof (subscription as { status?: unknown }).status === "string"
            ? ((subscription as { status: string }).status as string)
            : "inactive";
        const existingSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        const customerId =
          typeof existingSubscription.customer === "string"
            ? existingSubscription.customer
            : existingSubscription.customer?.id ?? null;
        const userId = existingSubscription.metadata?.userId;
        const currentPeriodEnd = toCurrentPeriodEndIso(existingSubscription);

        if (!userId) break;
        await upsertSubscriptionRecord({
          userId,
          subscriptionId: stripeSubscriptionId,
          customerId,
          status,
          currentPeriodEnd,
          plan: derivePlanFromSubscriptionStatus(status),
        });

        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as unknown;
        const stripeSubscriptionId = getInvoiceSubscriptionId(invoice);
        if (!stripeSubscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        const userId = subscription.metadata?.userId;
        if (!userId) break;
        await upsertSubscriptionRecord({
          userId,
          subscriptionId: stripeSubscriptionId,
          customerId:
            typeof subscription.customer === "string"
              ? subscription.customer
              : subscription.customer?.id ?? null,
          status: "active",
          currentPeriodEnd: toCurrentPeriodEndIso(subscription),
          plan: "pro",
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown;
        const stripeSubscriptionId = getInvoiceSubscriptionId(invoice);
        if (!stripeSubscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        const userId = subscription.metadata?.userId;
        if (!userId) break;
        await upsertSubscriptionRecord({
          userId,
          subscriptionId: stripeSubscriptionId,
          customerId:
            typeof subscription.customer === "string"
              ? subscription.customer
              : subscription.customer?.id ?? null,
          status: "past_due",
          currentPeriodEnd: toCurrentPeriodEndIso(subscription),
          plan: "pro",
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubscriptionId = subscription.id;
        const userId = subscription.metadata?.userId;
        if (!userId) break;
        await upsertSubscriptionRecord({
          userId,
          subscriptionId: stripeSubscriptionId,
          customerId:
            typeof subscription.customer === "string"
              ? subscription.customer
              : subscription.customer?.id ?? null,
          status: "canceled",
          currentPeriodEnd: toCurrentPeriodEndIso(subscription),
          plan: "free",
        });
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

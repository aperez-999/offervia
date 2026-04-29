import stripe from "@/lib/stripe";
import { getServiceSupabase } from "@/lib/supabase/service";

function isoFromUnixSeconds(seconds: number | null | undefined) {
  if (!seconds || typeof seconds !== "number") return null;
  const ms = seconds * 1000;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
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

export function toCurrentPeriodEndIso(subscriptionLike: unknown) {
  return getCurrentPeriodEndIso(subscriptionLike);
}

type SyncResult = {
  userId: string;
  subscriptionId: string;
  customerId: string | null;
  status: string;
  plan: "free" | "pro";
  currentPeriodEnd: string | null;
};

export async function upsertSubscriptionRecord({
  userId,
  subscriptionId,
  customerId,
  status,
  currentPeriodEnd,
  plan = "pro",
}: {
  userId: string;
  subscriptionId: string;
  customerId: string | null;
  status: string;
  currentPeriodEnd: string | null;
  plan?: "free" | "pro";
}) {
  const supabase = getServiceSupabase();

  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      plan,
      status,
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );
}

export async function syncSubscriptionFromCheckoutSession({
  sessionId,
  expectedUserId,
}: {
  sessionId: string;
  expectedUserId?: string;
}): Promise<SyncResult> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  const userId = session.metadata?.userId;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const subscription =
    typeof session.subscription === "string"
      ? await stripe.subscriptions.retrieve(session.subscription)
      : session.subscription;
  const subscriptionId = subscription?.id;

  if (!userId || !subscriptionId || !subscription) {
    throw new Error("Stripe checkout session is missing user or subscription metadata.");
  }

  if (expectedUserId && userId !== expectedUserId) {
    throw new Error("Stripe checkout session user does not match the authenticated user.");
  }

  const status =
    typeof subscription.status === "string" && subscription.status.length > 0
      ? subscription.status
      : "active";
  const currentPeriodEnd = getCurrentPeriodEndIso(subscription);

  await upsertSubscriptionRecord({
    userId,
    subscriptionId,
    customerId,
    status,
    currentPeriodEnd,
    plan: "pro",
  });

  return {
    userId,
    subscriptionId,
    customerId,
    status,
    plan: "pro",
    currentPeriodEnd,
  };
}

export function getInvoiceSubscriptionId(invoiceLike: unknown): string | null {
  if (!invoiceLike || typeof invoiceLike !== "object") return null;
  if (!("subscription" in invoiceLike)) return null;
  const subscription = (invoiceLike as { subscription?: unknown }).subscription;
  if (typeof subscription === "string") return subscription;
  if (
    subscription &&
    typeof subscription === "object" &&
    "id" in subscription &&
    typeof (subscription as { id?: unknown }).id === "string"
  ) {
    return (subscription as { id: string }).id;
  }
  return null;
}

export function derivePlanFromSubscriptionStatus(status: string): "free" | "pro" {
  return ["active", "trialing", "past_due"].includes(status) ? "pro" : "free";
}

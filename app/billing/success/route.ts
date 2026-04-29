import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { syncSubscriptionFromCheckoutSession } from "@/lib/billing/subscription-sync";
import { captureServerException } from "@/lib/monitoring/sentry";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id")?.trim();

  const { user, error } = await getCurrentUser();
  if (error || !user?.id) {
    return NextResponse.redirect(new URL("/login", url));
  }

  if (!sessionId) {
    return NextResponse.redirect(new URL("/dashboard?upgrade=success", url));
  }

  try {
    await syncSubscriptionFromCheckoutSession({
      sessionId,
      expectedUserId: user.id,
    });
  } catch (err) {
    captureServerException(err, {
      route: "billing/success",
      extras: { sessionId, userId: user.id },
    });
    console.error("[billing-success-sync]", err);
  }

  return NextResponse.redirect(new URL("/dashboard?upgrade=success", url));
}

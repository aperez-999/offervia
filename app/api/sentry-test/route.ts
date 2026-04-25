import { NextResponse } from "next/server";

import { captureServerException } from "@/lib/monitoring/sentry";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const error = new Error("Local Sentry server test");
  const eventId = captureServerException(error, {
    route: "/api/sentry-test",
    extras: {
      source: "local-dev",
      purpose: "sentry-verification",
    },
  });

  return NextResponse.json(
    {
      ok: false,
      error: "Server test event captured.",
      eventId,
    },
    { status: 500 }
  );
}

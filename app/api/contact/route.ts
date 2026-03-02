import { NextResponse } from "next/server";
import { z } from "zod";
import { sendContactEmail } from "@/lib/email";
import { getServiceSupabase } from "@/lib/supabase/service";
import { getIpUa } from "@/lib/rate-limit";
import { enforceRateLimitByIp } from "@/lib/rate-limit";

const contactSchema = z
  .object({
    name: z.string().min(1).max(80),
    email: z.string().email().max(120),
    subject: z.string().max(200).optional(),
    message: z.string().min(1).max(5000),
    website: z.string().max(200).optional(), // honeypot
  })
  .strict();

function isSameOrigin(origin: string | null, referer: string | null): boolean {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "";
  if (!siteUrl) return false;
  let allowedHost: string;
  try {
    allowedHost = new URL(siteUrl).hostname;
  } catch {
    return false;
  }
  if (origin) {
    try {
      return new URL(origin).hostname === allowedHost;
    } catch {
      return false;
    }
  }
  if (referer) {
    try {
      return new URL(referer).hostname === allowedHost;
    } catch {
      return false;
    }
  }
  return false;
}

export async function POST(req: Request) {
  try {
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    const isDev = process.env.NODE_ENV === "development";
    const allowed =
      isSameOrigin(origin, referer) || (isDev && (!origin || origin.includes("localhost")));
    if (!allowed) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Request not allowed." },
        { status: 403 }
      );
    }

    const toEmail = process.env.CONTACT_TO_EMAIL;
    if (!toEmail) {
      return NextResponse.json(
        { error: "SERVER_ERROR", message: "Something went wrong." },
        { status: 500 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Invalid request." },
        { status: 400 }
      );
    }

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Invalid request." },
        { status: 400 }
      );
    }

    const { name, email, message, subject, website } = parsed.data;

    if (website && website.trim().length > 0) {
      return NextResponse.json({ ok: true });
    }

    const supabase = getServiceSupabase();
    const { ip } = getIpUa(req);
    const ipKey = ip || "unknown";
    const rl = await enforceRateLimitByIp(supabase, "contact", ipKey, [
      { ms: 60_000, limit: 3 },
      { ms: 86_400_000, limit: 20 },
    ]);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Too many requests. Try again soon." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds ?? 60) } }
      );
    }

    const trimmedSubject =
      (subject || "").trim().replace(/\r?\n/g, " ").slice(0, 160) || "New contact message";

    await sendContactEmail({
      fromName: name.trim(),
      fromEmail: email.trim(),
      toEmail,
      subject: trimmedSubject,
      message: message.trim(),
      replyTo: email.trim(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Failed to send your message. Please try again." },
      { status: 500 }
    );
  }
}

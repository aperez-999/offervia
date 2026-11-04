import { z } from "zod";
import { sendContactEmail } from "@/lib/email";
import { getServiceSupabase } from "@/lib/supabase/service";
import { getIpUa } from "@/lib/rate-limit";
import { enforceRateLimitByIp } from "@/lib/rate-limit";
import { serverEnv } from "@/lib/env/server";
import { fail } from "@/lib/api/response";

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
  const siteUrl = serverEnv.NEXT_PUBLIC_SITE_URL || "";
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
    const isDev = serverEnv.NODE_ENV === "development";
    const allowed =
      isSameOrigin(origin, referer) || (isDev && (!origin || origin.includes("localhost")));
    if (!allowed) {
      return fail("BAD_REQUEST", "Request not allowed.", 403);
    }

    const toEmail = serverEnv.CONTACT_TO;
    if (!toEmail) {
      return fail("SERVER_ERROR", "Couldn't send your message. Try again later.", 500);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail("INVALID_INPUT", "That request wasn't valid. Refresh the page and try again.", 400);
    }

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return fail("INVALID_INPUT", "That request wasn't valid. Refresh the page and try again.", 400);
    }

    const { name, email, message, subject, website } = parsed.data;

    if (website && website.trim().length > 0) {
      return Response.json({ ok: true });
    }

    const supabase = getServiceSupabase();
    const { ip } = getIpUa(req);
    const ipKey = ip || "unknown";
    const rl = await enforceRateLimitByIp(supabase, "contact", ipKey, [
      { ms: 60_000, limit: 3 },
      { ms: 86_400_000, limit: 20 },
    ]);
    if (!rl.ok) {
      return fail("RATE_LIMITED", "Too many requests. Wait a minute and try again.", 429, {
        headers: { "Retry-After": String(rl.retryAfterSeconds ?? 60) },
      });
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

    return Response.json({ ok: true });
  } catch {
    return fail("SERVER_ERROR", "Couldn't send your message. Try again in a moment.", 500);
  }
}

// app/api/contact/route.ts
import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/email";

type Body = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  // honeypot (bots fill it, humans won't)
  website?: string;
};

// super-light per-instance throttle (helps locally; not persistent in serverless)
const lastByIp = new Map<string, number>();
const ONE_MIN = 60_000;

export async function POST(req: Request) {
  try {
    const toEmail = process.env.CONTACT_TO_EMAIL;
    if (!toEmail) {
      return NextResponse.json(
        { error: "Contact is not configured." },
        { status: 500 }
      );
    }

    const { name = "", email = "", subject = "", message = "", website = "" } =
      (await req.json()) as Body;

    // honeypot (if filled -> likely bot)
    if (website && website.trim().length > 0) {
      // Pretend success (don’t help bots)
      return NextResponse.json({ ok: true });
    }

    // basic validation
    const trimmedName = name.trim().slice(0, 120);
    const trimmedEmail = email.trim().slice(0, 200);
    const trimmedSubject =
      subject.trim().replace(/\r?\n/g, " ").slice(0, 160) || "New contact message";
    const trimmedMsg = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMsg) {
      return NextResponse.json(
        { error: "Please include your name, email, and a message." },
        { status: 400 }
      );
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Invalid email address.", message: "Invalid email address." },
        { status: 400 }
      );
    }

    if (trimmedMsg.length > 5000) {
      return NextResponse.json(
        {
          error: "Message is too long (max 5000 characters).",
          message: "Message is too long (max 5000 characters).",
        },
        { status: 400 }
      );
    }

    // quick per-IP throttle (1/min)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const now = Date.now();
    const last = lastByIp.get(ip) || 0;
    if (now - last < ONE_MIN) {
      const msg = "You can send one message per minute. Please try again shortly.";
      return NextResponse.json(
        { error: msg, message: msg },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    await sendContactEmail({
      fromName: trimmedName,
      fromEmail: trimmedEmail,
      toEmail,
      subject: trimmedSubject,
      message: trimmedMsg,
      replyTo: trimmedEmail,
    });

    lastByIp.set(ip, now);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      {
        error: "Failed to send your message. Please try again.",
        message: "Failed to send your message. Please try again.",
      },
      { status: 500 }
    );
  }
}
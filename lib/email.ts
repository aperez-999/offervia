// lib/email.ts
import nodemailer, { Transporter } from "nodemailer";

let cachedTransporter: Transporter | null = null;

export function getMailer() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST!;
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = String(process.env.SMTP_SECURE || "true") === "true";
  const user = process.env.SMTP_USER!;
  const pass = process.env.SMTP_PASS!;

  if (!host || !user || !pass) {
    throw new Error("SMTP env vars are missing. Check .env.local");
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    // good defaults for SMTP pooling in serverless
    pool: true,
    maxConnections: 2,
    maxMessages: 10,
  });

  return cachedTransporter;
}

export async function sendContactEmail(opts: {
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  message: string;
  replyTo?: string;
}) {
  const transporter = getMailer();

  const text = [
    `From: ${opts.fromName} <${opts.fromEmail}>`,
    `Subject: ${opts.subject}`,
    "",
    opts.message,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.4">
      <p><strong>From:</strong> ${escapeHtml(opts.fromName)} &lt;${escapeHtml(
    opts.fromEmail
  )}&gt;</p>
      <p><strong>Subject:</strong> ${escapeHtml(opts.subject)}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0" />
      <pre style="white-space:pre-wrap;font:inherit;margin:0">${escapeHtml(opts.message)}</pre>
    </div>
  `;

  return transporter.sendMail({
    from: `"${process.env.CONTACT_FROM_NAME || "Offervia"}" <${
      process.env.CONTACT_FROM_EMAIL
    }>`,
    to: opts.toEmail,
    subject: `[Offervia] ${opts.subject || "New contact message"}`,
    text,
    html,
    replyTo: opts.replyTo || opts.fromEmail,
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
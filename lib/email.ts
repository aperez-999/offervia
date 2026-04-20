// lib/email.ts
import nodemailer, { Transporter } from "nodemailer";
import { serverEnv } from "@/lib/env/server";

let cachedTransporter: Transporter | null = null;

export function getMailer() {
  if (cachedTransporter) return cachedTransporter;

  const host = serverEnv.SMTP_HOST!;
  const port = Number(serverEnv.SMTP_PORT || 465);
  const secure = String(process.env.SMTP_SECURE || "true") === "true";
  const user = serverEnv.SMTP_USER!;
  const pass = serverEnv.SMTP_PASS!;

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
    from: `"${serverEnv.CONTACT_FROM_NAME || "Offervia"}" <${serverEnv.CONTACT_FROM_EMAIL}>`,
    to: opts.toEmail,
    subject: `[Offervia] ${opts.subject || "New contact message"}`,
    text,
    html,
    replyTo: opts.replyTo || opts.fromEmail,
  });
}

export async function sendUserDigestEmail(opts: {
  toEmail: string;
  subject: string;
  preheader?: string;
  text: string;
  html: string;
}) {
  const transporter = getMailer();
  return transporter.sendMail({
    from: `"${serverEnv.CONTACT_FROM_NAME || "Offervia"}" <${serverEnv.CONTACT_FROM_EMAIL}>`,
    to: opts.toEmail,
    subject: opts.subject,
    text: opts.text,
    html: wrapDigestHtml(opts.html, opts.preheader),
  });
}

function wrapDigestHtml(inner: string, preheader?: string) {
  const pre = preheader ? escapeHtml(preheader) : "";
  return `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${pre}</div>
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.45">
      <div style="max-width:680px;margin:0 auto;padding:20px">
        <div style="margin-bottom:14px">
          <div style="font-weight:700;font-size:18px">Offervia</div>
          <div style="color:#6b7280;font-size:13px">Weekly summary</div>
        </div>
        <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px">
          ${inner}
        </div>
        <div style="margin-top:14px;color:#6b7280;font-size:12px">
          Manage email settings in your Offervia settings page.
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
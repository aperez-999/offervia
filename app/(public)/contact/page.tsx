"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, MessageSquareText, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { InputField, TextareaField } from "@/components/ui/FormFields";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [errMsg, setErrMsg] = useState<string>("");

  // honeypot (bots will fill it; humans won't)
  const [website, setWebsite] = useState("");

  function validate() {
    const n = name.trim();
    const e = email.trim();
    const m = message.trim();
    if (!n || !e || !m) {
      setErrMsg("Please include your name, email, and a message.");
      return false;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
      setErrMsg("Please enter a valid email address.");
      return false;
    }
    if (m.length > 5000) {
      setErrMsg("Message is too long (max 5000 characters).");
      return false;
    }
    return true;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setStatus("idle");
    setErrMsg("");

    if (!validate()) {
      setStatus("err");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: `Feedback from ${name.trim()}`,
          message: message.trim(),
          website, // hidden honeypot
        }),
      });

      if (res.ok) {
        setStatus("ok");
        setName("");
        setEmail("");
        setMessage("");
        setWebsite("");
      } else {
        let serverMsg = "Something went wrong. Please try again.";
        try {
          const j = await res.json();
          if (j?.error) serverMsg = String(j.error);
        } catch {}
        if (res.status === 429) {
          const ra = res.headers.get("Retry-After");
          serverMsg = `You're sending messages too fast. Try again in ${ra ?? "a few"} seconds.`;
        }
        setErrMsg(serverMsg);
        setStatus("err");
      }
    } catch {
      setErrMsg("Network error. Please check your connection and try again.");
      setStatus("err");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-foreground">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-semibold tracking-tight text-foreground dark:text-white">
          Contact Offervia
        </h1>
        <p className="mt-2 text-sm text-muted-foreground dark:text-white">
          Have feedback or questions? We’d love to hear from you.
        </p>
      </motion.header>

      {/* Form card */}
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="mx-auto grid gap-4 rounded-2xl border border-white/10 bg-card/60 p-6 shadow-sm ring-1 ring-white/5 backdrop-blur-sm dark:ring-black/10 sm:max-w-xl"
      >
        {/* Success / error banner */}
        {status !== "idle" && (
          <div
            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
              status === "ok"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/20 bg-rose-500/10 text-rose-300"
            }`}
          >
            {status === "ok" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4" />
            )}
            <p>
              {status === "ok"
                ? "Thanks for reaching out — we’ll get back to you soon."
                : errMsg || "Something went wrong. Please try again."}
            </p>
          </div>
        )}

        {/* Name & Email */}
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Name"
            id="contact-name"
            icon={<User className="h-4 w-4" />}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            disabled={submitting}
            name="name"
            autoComplete="name"
          />
          <InputField
            label="Email"
            id="contact-email"
            icon={<Mail className="h-4 w-4" />}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={submitting}
            name="email"
            autoComplete="email"
          />
        </div>

        {/* Message */}
        <TextareaField
          label="Message"
          id="contact-message"
          icon={<MessageSquareText className="h-4 w-4" />}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help?"
          required
          disabled={submitting}
          name="message"
        />

        {/* Honeypot (hidden) */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />

        {/* Submit */}
        <div className="mt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-black"
          >
            <Send className={`h-4 w-4 ${submitting ? "animate-pulse" : ""}`} />
            {submitting ? "Sending…" : "Submit"}
          </button>
        </div>

        {/* Small reassurance line */}
        <p className="mt-1 text-center text-xs text-foreground/60">
          We usually reply within 1–2 business days.
        </p>
      </motion.form>
    </main>
  );
}
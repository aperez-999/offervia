"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  MessageSquareText,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  HelpCircle,
  Github,
} from "lucide-react";
import { InputField, TextareaField } from "@/components/ui/FormFields";
import { captureClientException } from "@/lib/monitoring/sentry";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Contact form error:", error);
      captureClientException(error, { scope: "contact.submit" });
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <main className="relative overflow-hidden text-foreground">
      {/* Token-driven backdrop, consistent with the app */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="brand-glow absolute inset-x-0 -top-24 h-96" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <MessageSquareText className="h-6 w-6" />
          </div>
          <p className="mt-4 text-xs font-semibold text-primary">
            Contact
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
            Get in touch
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-foreground/70 sm:text-base">
            Send a question, a bug report, or a feature request. We usually reply within 24 hours on business days.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="lg:col-span-2"
          >
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">Send a message</h2>
                <p className="mt-1 text-sm text-foreground/60">
                  All fields are required.
                </p>
              </div>

              {submitStatus === "success" && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-4"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                  <p className="text-sm font-medium text-success">
                    Message sent. We&apos;ll reply to the email you gave.
                  </p>
                </motion.div>
              )}

              {submitStatus === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4"
                >
                  <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
                  <p className="text-sm font-medium text-destructive">
                    Your message didn&apos;t send. Try again, or check your connection.
                  </p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InputField
                    label="Name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    icon={User}
                  />
                  <InputField
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    icon={Mail}
                  />
                </div>

                <InputField
                  label="Subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  icon={MessageSquareText}
                />

                <TextareaField
                  label="Message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={7}
                  placeholder="What do you need help with?"
                />

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileTap={{ scale: 0.99 }}
                  className="bg-brand-gradient flex w-full items-center justify-center gap-2.5 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send message
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* Side rail */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* What to contact us about */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">What you can ask about</h3>
              </div>
              <ul className="mt-4 space-y-2.5">
                {[
                  "Problems with your resume or a scan",
                  "Bugs and feature requests",
                  "How resume and cover letter drafts work",
                  "Billing and account questions",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/80">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Response time */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Response time</h3>
              </div>
              <p className="mt-3 text-sm text-foreground/70">
                Usually within 24 hours on business days.
              </p>
              <div className="mt-4 space-y-2 text-xs text-foreground/70">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Mon to Fri, 9 AM to 6 PM EST
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                  Weekend replies take longer
                </div>
              </div>
            </div>

            {/* Connect */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 text-info">
                  <Github className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Elsewhere</h3>
              </div>
              <div className="mt-4 space-y-2">
                <a
                  href="https://github.com/aperez-999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground/70 transition-colors group-hover:text-primary">
                    <Github className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">GitHub</span>
                    <p className="text-xs text-foreground/60">Code and issues</p>
                  </div>
                </a>
                <a
                  href="https://x.com/aperez_999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground/70 transition-colors group-hover:text-primary">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">Twitter / X</span>
                    <p className="text-xs text-foreground/60">Product updates</p>
                  </div>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

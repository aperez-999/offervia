"use client";

import { useState } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import { Mail } from "lucide-react";
import { postJson } from "@/lib/safe-fetch";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle"|"sending"|"sent"|"error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const result = await postJson<{ success: true; data: { message: string } }>("/api/auth/forgot-password", {
      email,
    });

    if (!result.ok) {
      setError(result.error);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto rounded-2xl border border-border bg-card/70 backdrop-blur-lg shadow-xl p-6">
        <h1 className="text-xl font-semibold text-foreground">Forgot your password?</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Enter your email and we’ll send you a secure reset link.
        </p>

        <form method="post" onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Email</label>
            <div className="mt-1 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-foreground/50">
                <Mail size={16}/>
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-border pl-9 pr-3 py-2 text-sm bg-background/80 text-foreground placeholder:text-foreground/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10  border border-destructive/30  rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "sending" || status === "sent"}
            className="w-full h-10 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : status === "sent" ? "Email sent" : "Send reset link"}
          </button>
        </form>

        {status === "sent" && (
          <p className="mt-4 text-sm text-foreground/70">
            Check your inbox for a reset link. The link will open this site to set a new password.
          </p>
        )}
      </div>
    </AuthLayout>
  );
}

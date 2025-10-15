"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import AuthLayout from "@/components/auth/AuthLayout";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle"|"sending"|"sent"|"error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto rounded-2xl border border-black/5 bg-white/70 backdrop-blur-lg shadow-xl p-6">
        <h1 className="text-xl font-semibold text-gray-900">Forgot your password?</h1>
        <p className="mt-1 text-sm text-gray-600">
          Enter your email and we’ll send you a secure reset link.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Mail size={16}/>
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "sending" || status === "sent"}
            className="w-full h-10 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : status === "sent" ? "Email sent" : "Send reset link"}
          </button>
        </form>

        {status === "sent" && (
          <p className="mt-4 text-sm text-gray-600">
            Check your inbox for a reset link. The link will open this site to set a new password.
          </p>
        )}
      </div>
    </AuthLayout>
  );
}
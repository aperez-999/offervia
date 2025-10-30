"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import AuthLayout from "@/components/auth/AuthLayout";
import { Lock } from "lucide-react";

type Status = "checking" | "ready" | "invalid" | "updating";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClientComponentClient(), []);

  const [status, setStatus] = useState<Status>("checking");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeout: any;
    const subRef: { unsub?: () => void } = {};

    async function bootstrap() {
      // Case 1: PKCE code flow via query param
      const code = searchParams.get("code");
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && data?.session) {
          setStatus("ready");
          return;
        }
        setStatus("invalid");
        return;
      }

      // Case 2: Recovery session flow (no tokens in URL). Try existing session first.
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setStatus("ready");
        return;
      }

      // Listen briefly for auth events that indicate a valid recovery session.
      const { data: listener } = supabase.auth.onAuthStateChange((event: any) => {
        if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
          setStatus("ready");
        }
      });
      subRef.unsub = () => listener.subscription.unsubscribe();

      timeout = setTimeout(() => {
        setStatus((prev) => (prev === "checking" ? "invalid" : prev));
      }, 1200);
    }

    bootstrap();

    return () => {
      if (timeout) clearTimeout(timeout);
      subRef.unsub?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (pw !== pw2) {
      setError("Passwords do not match.");
      return;
    }
    setStatus("updating");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) {
      setError(error.message || "Failed to reset password. Try again.");
      setStatus("ready");
      return;
    }
    await supabase.auth.signOut();
    router.replace("/login?reset=1");
  }

  return (
    <AuthLayout>
      <div className="mb-5 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Reset your password</h1>
        <p className="mt-1 text-sm text-gray-600">You will be securely signed out after reset.</p>
      </div>

      {status === "checking" && (
        <div className="py-6 text-center text-sm text-gray-600">Validating link…</div>
      )}

      {status === "invalid" && (
        <div className="space-y-3">
          <div className="rounded-md border border-rose-200 dark:border-rose-800/30 bg-rose-50 dark:bg-rose-950/20 p-3 text-sm text-rose-700 dark:text-rose-300">Invalid or expired reset link.</div>
          <a href="/forgot-password" className="block text-center text-sm text-foreground/70 underline hover:text-foreground">Return to Forgot Password</a>
        </div>
      )}

      {status !== "checking" && status !== "invalid" && (
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-1">
            <label className="text-sm font-medium text-gray-700">New Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type={showPw ? "text" : "password"}
                className="w-full rounded border p-2 pl-8 pr-16 focus:outline-none focus:ring-2 focus:ring-[#645CFF] focus:border-[#645CFF]"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-600 underline"
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium text-gray-700">Confirm Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type={showPw2 ? "text" : "password"}
                className="w-full rounded border p-2 pl-8 pr-16 focus:outline-none focus:ring-2 focus:ring-[#645CFF] focus:border-[#645CFF]"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw2((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-600 underline"
              >
                {showPw2 ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={status === "updating"}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 p-2 text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "updating" && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            <span>Update Password</span>
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

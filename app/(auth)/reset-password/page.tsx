"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import { Lock } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth/errors";

type Status = "checking" | "ready" | "invalid" | "updating";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => getBrowserSupabase(), []);

  const [status, setStatus] = useState<Status>("checking");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const subRef: { unsub?: () => void } = {};
    let timeout: ReturnType<typeof setTimeout> | undefined;

    async function bootstrap() {
      // ✅ Check if there's already a session (e.g., redirected from Supabase recovery link)
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setStatus("ready");
        return;
      }

      // ✅ Listen for Supabase PASSWORD_RECOVERY event
      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "PASSWORD_RECOVERY" && session) {
          setStatus("ready");
        } else if (event === "SIGNED_IN" && session) {
          setStatus("ready");
        }
      });

      subRef.unsub = () => listener.subscription.unsubscribe();

      // ⏳ Fallback timeout in case no session is detected
      timeout = setTimeout(() => {
        setStatus((prev) => (prev === "checking" ? "invalid" : prev));
      }, 3000);
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
      setError(getAuthErrorMessage(error, "reset-password"));
      setStatus("ready");
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login?reset=1");
  }

  return (
    <AuthLayout>
      <div className="mb-5 text-center">
        <h1 className="text-xl font-semibold text-foreground">Reset your password</h1>
        <p className="mt-1 text-sm text-foreground/70">
          You will be securely signed out after reset.
        </p>
      </div>

      {status === "checking" && (
        <div className="py-6 text-center text-sm text-foreground/70">
          Validating link…
        </div>
      )}

      {status === "invalid" && (
        <div className="space-y-3">
          <div className="rounded-md border border-destructive/30  bg-destructive/10  p-3 text-sm text-destructive">
            Invalid or expired reset link.
          </div>
          <a
            href="/forgot-password"
            className="block text-center text-sm text-foreground/70 underline hover:text-foreground"
          >
            Return to Forgot Password
          </a>
        </div>
      )}

      {status !== "checking" && status !== "invalid" && (
        <form method="post" onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-1">
            <label className="text-sm font-medium text-foreground">New Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
              <input
                type={showPw ? "text" : "password"}
                className="w-full rounded border border-border bg-background/80 text-foreground p-2 pl-8 pr-16 placeholder:text-foreground/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-foreground/70 underline"
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium text-foreground">Confirm Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
              <input
                type={showPw2 ? "text" : "password"}
                className="w-full rounded border border-border bg-background/80 text-foreground p-2 pl-8 pr-16 placeholder:text-foreground/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw2((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-foreground/70 underline"
              >
                {showPw2 ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={status === "updating"}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary p-2 text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "updating" && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            <span className="cursor-pointer">Update Password</span>
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

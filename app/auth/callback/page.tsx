// app/auth/callback/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = getBrowserSupabase();

  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    (async () => {
      // Provider bounced us back with an error?
      const err = params.get("error_description") || params.get("error");
      if (err) {
        setStatus("error");
        setErrorMsg(decodeURIComponent(err));
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          setStatus("error");
          setErrorMsg(error.message || "Failed to sign in.");
          return;
        }
        
        if (!session) {
          setStatus("error");
          setErrorMsg("No session found. Please try signing in again.");
          return;
        }

        // Redirect to where we planned to go
        let next = "/dashboard?login=1";
        try {
          const key = "offervia:postAuthRedirect";
          const stored = localStorage.getItem(key);
          if (stored) {
            next = stored;
            localStorage.removeItem(key);
          }
        } catch {}

        router.replace(next);
        router.refresh();
      } catch (e: any) {
        setStatus("error");
        setErrorMsg(e?.message || "Unexpected error.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "error") {
    return (
      <div className="mx-auto max-w-md p-6">
        <Card className="rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <CardHeader>
            <CardTitle className="text-foreground">Sign-in failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80">{errorMsg}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid min-h-[40vh] place-items-center p-6 text-sm text-foreground/70">
      Signing you in…
    </div>
  );
}
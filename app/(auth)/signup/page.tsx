"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import AuthLayout from "@/components/auth/AuthLayout";
import SignupForm from "./_form";
import Link from "next/link";
import { Linkedin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type OAuthProvider = "google" | "linkedin_oidc";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const supabase = getBrowserSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.replace("/dashboard");
    })();
  }, [router]);

  async function startOAuth(provider: OAuthProvider) {
    try {
      try { localStorage.setItem("offervia:postAuthRedirect", "/dashboard?signup=1"); } catch {}

      const supabase = getBrowserSupabase();

      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: provider === "google" ? { access_type: "offline", prompt: "consent" } : undefined,
        },
      });
    } catch {
      toast({ title: "Could not start sign up", description: "Please try again.", variant: "destructive" });
    }
  }

  return (
    <AuthLayout>
      <div className="mb-5 text-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Create your Offervia account</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-white">Free Beta — No credit card required</p>
      </div>

      <SignupForm />

      {/* Social sign-up (circle icons) */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {/* Google */}
        <button
          type="button"
          aria-label="Sign up with Google"
          onClick={() => startOAuth("google")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          title="Sign up with Google"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.826 32.091 29.274 35 24 35c-7.18 0-13-5.82-13-13s5.82-13 13-13c3.314 0 6.313 1.243 8.594 3.281l5.657-5.657C34.885 3.053 29.706 1 24 1 11.85 1 2 10.85 2 23s9.85 22 22 22 22-9.85 22-22c0-1.477-.153-2.918-.389-4.417z" />
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.818C14.676 16.267 18.961 13 24 13c3.314 0 6.313 1.243 8.594 3.281l5.657-5.657C34.885 3.053 29.706 1 24 1 15.317 1 7.96 5.795 4.081 12.691l2.225 2z" />
            <path fill="#4CAF50" d="M24 45c5.166 0 9.86-1.977 13.409-5.197l-6.198-5.237C29.024 36.488 26.671 37 24 37c-5.241 0-9.709-3.355-11.303-8H6.27l-6.2 4.785C3.895 39.981 13.076 45 24 45z" />
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.36 4.012-5.125 7-9.303 7-5.241 0-9.709-3.355-11.303-8H6.27l-6.2 4.785C3.895 39.981 13.076 45 24 45c12.15 0 22-9.85 22-22 0-1.477-.153-2.918-.389-4.417z" />
          </svg>
        </button>

        {/* LinkedIn (OIDC) */}
        <button
          type="button"
          aria-label="Sign up with LinkedIn"
          onClick={() => startOAuth("linkedin_oidc")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          title="Sign up with LinkedIn"
        >
          <Linkedin className="h-4 w-4 text-gray-900 dark:text-white" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 text-center text-sm text-gray-600 dark:text-white">
        <span>Already have an account? </span>
        <Link href="/login" className="underline hover:text-gray-900 dark:hover:text-white/80">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
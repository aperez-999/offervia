"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginPanel from "@/components/auth/LoginPanel";
import SocialButtons, { OrDivider } from "@/components/auth/SocialButtons";
import LoginForm from "./_form";
import Link from "next/link";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get("reset") === "1") {
      toast({ variant: "success", title: "Password updated. Sign in with your new password." });
      router.replace("/login");
    }
    if (searchParams.get("auth_error") === "oauth_callback_failed") {
      toast({
        title: "Couldn't finish signing in",
        description: "Try again, or use your email.",
        variant: "destructive",
      });
      router.replace("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthLayout variant="split" panelSide="right" panel={<LoginPanel />}>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-foreground">Welcome back</h1>
        <p className="mt-1 text-sm text-foreground/70">Sign in to pick up where you left off.</p>
      </div>

      <SocialButtons flash />
      <OrDivider label="or with email" />
      <LoginForm />

      <p className="mt-6 text-center text-sm text-foreground/70">
        New here?{" "}
        <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
          Make a free account
        </Link>
      </p>
    </AuthLayout>
  );
}

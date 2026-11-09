"use client";

import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import SignupPanel from "@/components/auth/SignupPanel";
import SocialButtons, { OrDivider } from "@/components/auth/SocialButtons";
import SignupForm from "./_form";

export default function SignupPage() {
  return (
    <AuthLayout variant="split" panel={<SignupPanel />}>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-foreground">Make your free account</h1>
        <p className="mt-1 text-sm text-foreground/70">Takes about a minute.</p>
      </div>

      <SocialButtons />
      <OrDivider label="or with email" />
      <SignupForm />

      <p className="mt-6 text-center text-sm text-foreground/70">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        By signing up you agree to how we handle your data in{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
          Privacy and terms
        </Link>
        .
      </p>
    </AuthLayout>
  );
}

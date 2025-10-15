"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "./_form";
import Link from "next/link";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get("reset") === "1") {
      toast({ title: "Password reset successful — please sign in." });
      router.replace("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthLayout>
      <div className="mb-5 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Welcome back</h1>
        <p className="mt-1 text-sm text-gray-600">Let’s help you land your next offer.</p>
      </div>
      <LoginForm />
      {/* social placeholders */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-700 hover:bg-gray-50">Google</button>
        <button className="rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-700 hover:bg-gray-50">GitHub</button>
      </div>
      <div className="mt-4 text-center text-sm text-gray-600">
        <span>New to Offervia? </span>
        <Link href="/signup" className="underline hover:text-gray-900">Create an account</Link>
      </div>
      <p className="mt-2 text-center text-xs text-gray-500">Secure • Private • Built for job seekers</p>
    </AuthLayout>
  );
}

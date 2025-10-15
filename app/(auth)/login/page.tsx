"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "./_form";
import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";

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
      <div className="mt-4 flex items-center justify-center gap-2">
        <button aria-label="Sign in with Google" className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.826 32.091 29.274 35 24 35c-7.18 0-13-5.82-13-13s5.82-13 13-13c3.314 0 6.313 1.243 8.594 3.281l5.657-5.657C34.885 3.053 29.706 1 24 1 11.85 1 2 10.85 2 23s9.85 22 22 22 22-9.85 22-22c0-1.477-.153-2.918-.389-4.417z"/>
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.818C14.676 16.267 18.961 13 24 13c3.314 0 6.313 1.243 8.594 3.281l5.657-5.657C34.885 3.053 29.706 1 24 1 15.317 1 7.96 5.795 4.081 12.691l2.225 2z"/>
            <path fill="#4CAF50" d="M24 45c5.166 0 9.86-1.977 13.409-5.197l-6.198-5.237C29.024 36.488 26.671 37 24 37c-5.241 0-9.709-3.355-11.303-8H6.27l-6.2 4.785C3.895 39.981 13.076 45 24 45z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.36 4.012-5.125 7-9.303 7-5.241 0-9.709-3.355-11.303-8H6.27l-6.2 4.785C3.895 39.981 13.076 45 24 45c12.15 0 22-9.85 22-22 0-1.477-.153-2.918-.389-4.417z"/>
          </svg>
        </button>
        <button aria-label="Sign in with GitHub" className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50">
          <Github className="h-4 w-4" />
        </button>
        <button aria-label="Sign in with LinkedIn" className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50">
          <Linkedin className="h-4 w-4" />
        </button>
        <button aria-label="Sign in with X" className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50">
          <Twitter className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 text-center text-sm text-gray-600">
        <span>New to Offervia? </span>
        <Link href="/signup" className="underline hover:text-gray-900">Create an account</Link>
      </div>
      <p className="mt-2 text-center text-xs text-gray-500">Secure • Private • Built for job seekers</p>
    </AuthLayout>
  );
}

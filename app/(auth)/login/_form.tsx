"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { postJson } from "@/lib/safe-fetch";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Min 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });
  const [showPw, setShowPw] = useState(false);
  const safeNext = useMemo(
    () => sanitizeRedirectPath(search.get("next"), "/dashboard"),
    [search]
  );

  useEffect(() => {
    router.prefetch(safeNext);
  }, [router, safeNext]);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    const result = await postJson<{ success: true; data: { next: string } }>("/api/auth/login", {
      email: values.email,
      password: values.password,
      next: safeNext,
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }
    const dest = result.data.data.next || safeNext;

    try {
      sessionStorage.setItem("offervia:flash", "login");
    } catch {}
    router.replace(dest);
  };

  return (
    <form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground">Email</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="email"
            className="w-full rounded-md border border-border bg-background/80 p-2 pl-8 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            placeholder="you@example.com"
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-rose-600 dark:text-rose-400">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground">Password</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type={showPw ? "text" : "password"}
            className="w-full rounded-md border border-border bg-background/80 p-2 pl-8 pr-16 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            placeholder="Enter your password"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-foreground/70 underline hover:text-foreground"
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
        <div className="mt-1 text-right text-xs">
          <a href="/forgot-password" className="text-foreground/70 underline hover:text-foreground">
            Forgot password?
          </a>
        </div>
        {errors.password && (
          <p className="text-sm text-rose-600 dark:text-rose-400">{errors.password.message}</p>
        )}
      </div>

      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-brand-gradient p-2 text-white shadow-sm shadow-primary/30 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        <span>{isSubmitting ? "Signing in..." : "Sign In"}</span>
      </button>

      <p className="mt-2 text-center text-xs text-gray-500">
        Secure • Private • No spam
      </p>
    </form>
  );
}

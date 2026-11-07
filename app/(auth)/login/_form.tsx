"use client";

import { useMemo, useState } from "react";
import { Mail, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { postJson } from "@/lib/safe-fetch";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";
import AuthField, { PasswordToggle } from "@/components/auth/AuthField";

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
      <AuthField
        id="login-email"
        label="Email"
        icon={Mail}
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        registration={register("email")}
        error={errors.email?.message}
      />

      <div>
        <AuthField
          id="login-password"
          label="Password"
          icon={Lock}
          type={showPw ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Enter your password"
          registration={register("password")}
          error={errors.password?.message}
          rightSlot={<PasswordToggle shown={showPw} onToggle={() => setShowPw((v) => !v)} />}
        />
        <div className="mt-1.5 text-right text-xs">
          <a
            href="/forgot-password"
            className="rounded font-medium text-foreground/70 underline-offset-2 hover:text-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Forgot password?
          </a>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-medium text-white shadow-sm transition-all hover:brightness-110 motion-safe:active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        <span>{isSubmitting ? "Signing in…" : "Sign in"}</span>
      </button>
    </form>
  );
}

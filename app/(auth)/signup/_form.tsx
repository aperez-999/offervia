"use client";

import { useState } from "react";
import { EnvelopeSimple, Lock, User as UserIcon } from "@phosphor-icons/react/dist/ssr";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { nextFromLocation } from "@/lib/auth/redirect";
import { postJson } from "@/lib/safe-fetch";
import { useToast } from "@/hooks/use-toast";
import AuthField, { PasswordToggle } from "@/components/auth/AuthField";

const schema = z
  .object({
    name: z.string().min(1, "Enter your name"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirm: z.string().min(1, "Type your password again"),
  })
  .refine((v) => v.password === v.confirm, {
    message: "These don't match",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

export default function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirm: "" },
  });
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    const next = nextFromLocation();
    const result = await postJson<{ success: true; data: { message: string } }>("/api/auth/signup", {
      name: values.name,
      email: values.email,
      password: values.password,
      next,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }

    // Success: show verification toast immediately
    toast({ variant: "success",
      title: "Account created. Check your email for a confirmation link.",
      description: result.data.data.message,
    });
    setTimeout(() => {
      router.replace(next === "/dashboard" ? "/login" : `/login?next=${encodeURIComponent(next)}`);
    }, 2000);
  };

  return (
    <form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <AuthField
        id="signup-name"
        label="Name"
        icon={UserIcon}
        type="text"
        autoComplete="name"
        placeholder="Your name"
        registration={register("name")}
        error={errors.name?.message}
      />

      <AuthField
        id="signup-email"
        label="Email"
        icon={EnvelopeSimple}
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        registration={register("email")}
        error={errors.email?.message}
      />

      <AuthField
        id="signup-password"
        label="Password"
        icon={Lock}
        type={showPw ? "text" : "password"}
        autoComplete="new-password"
        placeholder="At least 8 characters"
        registration={register("password")}
        error={errors.password?.message}
        rightSlot={<PasswordToggle shown={showPw} onToggle={() => setShowPw((v) => !v)} />}
      />

      <AuthField
        id="signup-confirm"
        label="Confirm password"
        icon={Lock}
        type={showPw2 ? "text" : "password"}
        autoComplete="new-password"
        placeholder="Type it again"
        registration={register("confirm")}
        error={errors.confirm?.message}
        rightSlot={<PasswordToggle shown={showPw2} onToggle={() => setShowPw2((v) => !v)} />}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-button text-primary-button-foreground px-4 text-sm font-medium shadow-sm transition-all hover:brightness-110 motion-safe:active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        <span>{isSubmitting ? "Making your account…" : "Make my account"}</span>
      </button>
    </form>
  );
}

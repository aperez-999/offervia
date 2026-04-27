"use client";

import { useState } from "react";
import { User as UserIcon, Mail, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { postJson } from "@/lib/safe-fetch";
import { useToast } from "@/hooks/use-toast";

const schema = z
  .object({
    name: z.string().min(1, "Enter your name"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "Min 6 characters"),
    confirm: z.string().min(6, "Min 6 characters"),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
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
    const result = await postJson<{ success: true; data: { message: string } }>("/api/auth/signup", {
      name: values.name,
      email: values.email,
      password: values.password,
      next: "/dashboard?signup=1",
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }

    // Success: show verification toast immediately
    toast({
      title: "Account created successfully — check your email to confirm your account.",
      description: result.data.data.message,
    });
    setTimeout(() => {
      router.replace("/login");
      router.refresh();
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground">Name</label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            className="w-full rounded-md border border-border bg-background/80 p-2 pl-8 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-black"
            placeholder="Your name"
            {...register("name")}
          />
        </div>
        {errors.name && <p className="text-sm text-rose-600 dark:text-rose-400">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground">Email</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="email"
            className="w-full rounded-md border border-border bg-background/80 p-2 pl-8 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-black"
            placeholder="you@example.com"
            {...register("email")}
          />
        </div>
        {errors.email && <p className="text-sm text-rose-600 dark:text-rose-400">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-foreground">Password</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type={showPw ? "text" : "password"}
            className="w-full rounded-md border border-border bg-background/80 p-2 pl-8 pr-16 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-black"
            placeholder="Enter at least 6 characters"
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
        {errors.password && <p className="text-sm text-rose-600 dark:text-rose-400">{errors.password.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Confirm password</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type={showPw2 ? "text" : "password"}
            className="w-full rounded border p-2 pl-8 pr-16 focus:outline-none focus:ring-2 focus:ring-[#645CFF] focus:border-[#645CFF]"
            placeholder="Make sure passwords match"
            {...register("confirm")}
          />
          <button
            type="button"
            onClick={() => setShowPw2((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-600 underline"
          >
            {showPw2 ? "Hide" : "Show"}
          </button>
        </div>
        {errors.confirm && <p className="text-sm text-rose-600 dark:text-rose-400">{errors.confirm.message}</p>}
      </div>

      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-indigo-600 p-2 text-white hover:bg-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        <span>{isSubmitting ? "Creating..." : "Create Account"}</span>
      </button>

      <p className="mt-2 text-center text-xs text-gray-500">
        Secure • Private • No spam
      </p>
      <p className="mt-1 text-xs text-gray-600 text-center">
        Get started free — no credit card required
      </p>
    </form>
  );
}

"use client";

import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Min 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });
  const [showPw, setShowPw] = useState(false);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    const supabase = getBrowserSupabase();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      setError(error.message);
      return;
    }
    router.replace("/dashboard?login=1");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium">Email</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input type="email" className="w-full rounded border p-2 pl-8 focus:outline-none focus:ring-2 focus:ring-[#645CFF] focus:border-[#645CFF]" placeholder="you@example.com" {...register("email")} />
        </div>
        {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium">Password</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input type={showPw ? "text" : "password"} className="w-full rounded border p-2 pl-8 pr-16 focus:outline-none focus:ring-2 focus:ring-[#645CFF] focus:border-[#645CFF]" placeholder="Enter your password" {...register("password")} />
          <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-600 underline">
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
        <div className="mt-1 text-right text-xs">
          <a href="/forgot-password" className="text-gray-600 underline">Forgot password?</a>
        </div>
        {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-indigo-600 p-2 text-white hover:bg-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
        <span>{isSubmitting ? "Signing in..." : "Sign In"}</span>
      </button>
      <p className="mt-2 text-center text-xs text-gray-500">Secure • Private • No spam</p>
    </form>
  );
}

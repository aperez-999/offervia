"use client";

import { useState } from "react";
import { User as UserIcon, Mail, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";

const schema = z.object({
  name: z.string().min(1, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Min 6 characters"),
  confirm: z.string().min(6, "Min 6 characters"),
}).refine((v) => v.password === v.confirm, { message: "Passwords do not match", path: ["confirm"] });

type FormValues = z.infer<typeof schema>;

export default function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirm: "" },
  });
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    const supabase = getBrowserSupabase();
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });
    if (error) {
      setError(error.message);
      return;
    }
    // After signup, immediate sign-in is handled by Supabase if email confirmations are disabled.
    // We redirect to dashboard either way.
    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium">Name</label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input type="text" className="w-full rounded border p-2 pl-8 focus:outline-none focus:ring-2 focus:ring-[#645CFF] focus:border-[#645CFF]" placeholder="Your name" {...register("name")} />
        </div>
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>
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
          <input type={showPw ? "text" : "password"} className="w-full rounded border p-2 pl-8 pr-16 focus:outline-none focus:ring-2 focus:ring-[#645CFF] focus:border-[#645CFF]" {...register("password")} />
          <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-600 underline">
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
        {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium">Confirm password</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input type={showPw2 ? "text" : "password"} className="w-full rounded border p-2 pl-8 pr-16 focus:outline-none focus:ring-2 focus:ring-[#645CFF] focus:border-[#645CFF]" {...register("confirm")} />
          <button type="button" onClick={() => setShowPw2((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-600 underline">
            {showPw2 ? "Hide" : "Show"}
          </button>
        </div>
        {errors.confirm && <p className="text-sm text-red-600">{errors.confirm.message}</p>}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-indigo-600 p-2 text-white hover:bg-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
        <span>{isSubmitting ? "Creating..." : "Create Account"}</span>
      </button>
      <p className="mt-2 text-center text-xs text-gray-500">Secure • Private • No spam</p>
      <p className="mt-1 text-xs text-gray-600 text-center">Free Beta — no credit card required</p>
    </form>
  );
}

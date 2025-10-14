"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";

const schema = z.object({
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
    defaultValues: { email: "", password: "", confirm: "" },
  });

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
        <label className="block text-sm font-medium">Email</label>
        <input type="email" className="w-full border rounded p-2" placeholder="you@example.com" {...register("email")} />
        {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium">Password</label>
        <input type="password" className="w-full border rounded p-2" {...register("password")} />
        {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium">Confirm password</label>
        <input type="password" className="w-full border rounded p-2" {...register("confirm")} />
        {errors.confirm && <p className="text-sm text-red-600">{errors.confirm.message}</p>}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isSubmitting} className="w-full border rounded p-2 bg-black text-white">
        {isSubmitting ? "Creating..." : "Create account"}
      </button>
    </form>
  );
}

import { redirect } from "next/navigation";
import { getPublicSupabase } from "@/lib/supabase/server";
import AuthLayout from "@/components/auth/AuthLayout";
import SignupForm from "./_form";
import Link from "next/link";

export default async function SignupPage() {
  const supabase = getPublicSupabase();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthLayout>
      <div className="mb-5 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Create your Offervia account</h1>
        <p className="mt-1 text-sm text-gray-600">Free Beta — No credit card required</p>
      </div>
      <SignupForm />
      {/* social placeholders */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-700 hover:bg-gray-50">Google</button>
        <button className="rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-700 hover:bg-gray-50">GitHub</button>
      </div>
      <div className="mt-4 text-center text-sm text-gray-600">
        <span>Already have an account? </span>
        <Link href="/login" className="underline hover:text-gray-900">Sign in</Link>
      </div>
    </AuthLayout>
  );
}

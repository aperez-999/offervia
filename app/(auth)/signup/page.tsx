import { redirect } from "next/navigation";
import { getPublicSupabase } from "@/lib/supabase/server";
import SignupForm from "./_form";

export default async function SignupPage() {
  const supabase = getPublicSupabase();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="p-8 max-w-sm mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Create account</h1>
      <SignupForm />
    </main>
  );
}

"use client";

import { getBrowserSupabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignOutLink() {
  const router = useRouter();
  async function signOut() {
    const supabase = getBrowserSupabase();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }
  return (
    <button onClick={signOut} className="text-sm underline">Sign out</button>
  );
}

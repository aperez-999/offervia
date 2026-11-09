import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/ssr";
import { getCurrentUser } from "@/lib/auth/session";
import { readSavedResume } from "@/lib/profile/resume";

/** The signed-in user's saved resume text, or null. For server components. */
export async function readSavedResumeForCurrentUser(): Promise<string | null> {
  const { user } = await getCurrentUser();
  if (!user?.id) return null;
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient({
    get(name: string) {
      return cookieStore.get(name)?.value;
    },
  });
  return (await readSavedResume(supabase, user.id)).text;
}

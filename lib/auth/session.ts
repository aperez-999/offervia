import { cache } from "react";
import { cookies } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/ssr";
import { getUserSubscription, type UserSubscription } from "@/lib/subscription";

export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient({
    get(name: string) {
      return cookieStore.get(name)?.value;
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { user, error };
});

export const getCurrentUserSubscription = cache(
  async (userId: string): Promise<UserSubscription> => getUserSubscription(userId)
);

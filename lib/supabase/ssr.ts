import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env/public";

type CookieGet = { get(name: string): string | undefined };

/**
 * Server-side Supabase client for:
 * - Server Components (`next/headers` cookies store)
 * - Route handlers / API routes (parsed `Cookie` header map)
 *
 * Note: This helper is intentionally read-only for cookies. In middleware,
 * use a dedicated client that can write cookies to the response.
 */
export function createSupabaseServerClient(cookies: CookieGet): SupabaseClient {
  return createServerClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookies.get(name);
      },
      set() {},
      remove() {},
    },
  });
}


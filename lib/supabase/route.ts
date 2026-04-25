import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest, NextResponse } from "next/server";

import { publicEnv } from "@/lib/env/public";

type CookieMutation = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export function createSupabaseRouteHandlerClient(req: NextRequest): {
  supabase: SupabaseClient;
  applyCookies: (response: NextResponse) => NextResponse;
} {
  const cookieMutations: CookieMutation[] = [];

  const supabase = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookieMutations.push(...cookiesToSet);
        },
      },
    }
  );

  return {
    supabase,
    applyCookies(response) {
      cookieMutations.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      return response;
    },
  };
}

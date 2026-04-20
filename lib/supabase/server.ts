import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env/server";

// Service-role client (admin/server-side tasks only)
export function getServerSupabase(): SupabaseClient {
  return createClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "X-Client-Info": "server-service-role" } },
  });
}

// Public anon client configured to read incoming cookies via headers() for SSR session detection
export function getPublicSupabase(): SupabaseClient {
  return createClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

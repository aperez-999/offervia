import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env/server";

let serviceClient: SupabaseClient | null = null;

export function getServiceSupabase(): SupabaseClient {
  if (serviceClient) return serviceClient;
  serviceClient = createClient(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "X-Client-Info": "service-role" } },
  });
  return serviceClient;
}

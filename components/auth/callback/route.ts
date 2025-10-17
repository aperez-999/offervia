// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Supabase JS will POST here on auth state changes to sync cookies server-side.
export async function POST(request: Request) {
  const cookieStore = cookies();

  // We don't need to read the body; we just ensure Supabase sets cookies into the response.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  // Force a read so SSR helper writes any refreshed cookies
  await supabase.auth.getSession();

  return NextResponse.json({ ok: true });
}

// Avoid static optimization so cookies are mutable here
export const dynamic = "force-dynamic";
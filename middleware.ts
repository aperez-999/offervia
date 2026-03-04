// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  // Absolute passthrough for the OAuth callback (keeps ?code & ?state intact)
  if (req.nextUrl.pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  // Only protect the routes matched below (same idea as your config)
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options?: Record<string, unknown>) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options?: Record<string, unknown>) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(login);
  }

  return res;
}

// Same protected routes you had
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/resume/:path*",
    "/scanner/:path*",
    "/coach/:path*",
    "/tracker/:path*",
    "/resources/:path*",
    "/students/:path*",
    "/settings/:path*",
    "/profile/:path*",
  ],
};
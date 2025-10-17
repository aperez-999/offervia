// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  // Let the request continue; we'll modify cookies on `res` if Supabase needs to refresh.
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Supabase may refresh tokens; persist them to the response
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const login = new URL("/login", req.url);
    // preserve where the user was going
    login.searchParams.set(
      "next",
      req.nextUrl.pathname + req.nextUrl.search
    );
    return NextResponse.redirect(login);
  }

  return res;
}

// Protect all signed-in routes (add/remove as needed)
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
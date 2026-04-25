// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({
    request: req,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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
    "/templates/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/upcoming/:path*",
    "/job-packet/:path*",
    "/upgrade/:path*",
  ],
};

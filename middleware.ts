// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/job-packet",
  "/resume",
  "/cover-letter",
  "/scanner",
  "/coach",
  "/interview",
  "/tracker",
  "/documents",
  "/student-hub",
  "/bullet-check",
  "/offers",
  "/settings",
  "/profile",
];

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/") {
    const searchParams = req.nextUrl.searchParams;
    if (searchParams.has("code") || searchParams.has("error")) {
      const callbackUrl = new URL("/auth/callback", req.url);
      searchParams.forEach((value, key) => {
        callbackUrl.searchParams.append(key, value);
      });
      return NextResponse.redirect(callbackUrl);
    }
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => req.nextUrl.pathname === prefix || req.nextUrl.pathname.startsWith(`${prefix}/`)
  );
  if (!isProtected) {
    return NextResponse.next({
      request: req,
    });
  }

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

export const config = {
  // Must be a static literal for Next.js. middleware.test.ts keeps it in sync
  // with PROTECTED_PREFIXES and the folders under app/(protected).
  matcher: [
    "/",
    "/dashboard/:path*",
    "/job-packet/:path*",
    "/resume/:path*",
    "/cover-letter/:path*",
    "/scanner/:path*",
    "/coach/:path*",
    "/interview/:path*",
    "/tracker/:path*",
    "/documents/:path*",
    "/student-hub/:path*",
    "/bullet-check/:path*",
    "/offers/:path*",
    "/settings/:path*",
    "/profile/:path*",
  ],
};

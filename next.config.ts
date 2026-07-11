import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],

  async redirects() {
    return [
      { source: "/templates", destination: "/student-hub?tab=templates", permanent: false },
      { source: "/resources", destination: "/student-hub?tab=resources", permanent: false },
      { source: "/students", destination: "/student-hub?tab=deals", permanent: false },
      { source: "/upcoming", destination: "/dashboard", permanent: false },
    ];
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    // 'unsafe-eval' is only required by the Next.js dev runtime (React Refresh).
    // Production builds don't need it, so we drop it to tighten script-src.
    const scriptSrc = isProd
      ? "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com"
      : "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com";
    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value:
          `default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.groq.com https://*.ingest.sentry.io https://*.sentry.io https://va.vercel-scripts.com; frame-src 'self' blob:; form-action 'self';`,
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
      },
    ];

    if (process.env.NODE_ENV === "production") {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});

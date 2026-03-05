import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to succeed with ESLint errors
    // Only use this if you need to deploy immediately
    ignoreDuringBuilds: false, // Set to true only if absolutely necessary
  },
  typescript: {
    // Warning: This allows production builds to succeed with TypeScript errors
    // Only use this if you need to deploy immediately
    ignoreBuildErrors: false, // Set to true only if absolutely necessary
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.groq.com; frame-src 'self' blob:; frame-ancestors 'none';",
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

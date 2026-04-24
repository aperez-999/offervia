import { z } from "zod";

const nonEmpty = z.string().min(1);

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: nonEmpty.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: nonEmpty,

  NEXT_PUBLIC_APP_NAME: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),

  // Safe to expose (price id)
  NEXT_PUBLIC_STRIPE_PRICE_ID: z.string().optional(),

  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
});

let cached: z.infer<typeof publicEnvSchema> | null = null;

export function getPublicEnv() {
  if (cached) return cached;
  // IMPORTANT: These must be static property accesses so Next.js can inline NEXT_PUBLIC_* on the client.
  const raw = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_STRIPE_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
    NODE_ENV: process.env.NODE_ENV,
  };
  const parsed = publicEnvSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid NEXT_PUBLIC environment variables.\n${JSON.stringify(
        parsed.error.flatten().fieldErrors,
        null,
        2
      )}`
    );
  }
  cached = parsed.data;
  return cached;
}

export const publicEnv = getPublicEnv();

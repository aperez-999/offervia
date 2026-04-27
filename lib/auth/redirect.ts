const INTERNAL_PATH_PATTERN = /^\/(?!\/).*/;
export const OAUTH_NEXT_COOKIE = "offervia_oauth_next";

export function sanitizeRedirectPath(rawPath: string | null | undefined, fallback = "/dashboard?login=1") {
  if (!rawPath) return fallback;

  let decoded = rawPath;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return fallback;
  }

  if (!INTERNAL_PATH_PATTERN.test(decoded)) return fallback;
  if (decoded.includes("\n") || decoded.includes("\r")) return fallback;

  return decoded;
}

export function buildAuthCallbackUrl(origin: string, nextPath: string) {
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", nextPath);
  return callbackUrl.toString();
}

const INTERNAL_PATH_PATTERN = /^\/(?!\/).*/;
export const OAUTH_NEXT_COOKIE = "offervia_oauth_next";

// Any origin the browser can't reach means the path resolved off-site.
const PLACEHOLDER_ORIGIN = "https://placeholder.invalid";

export function sanitizeRedirectPath(rawPath: string | null | undefined, fallback = "/dashboard") {
  if (!rawPath) return fallback;

  let decoded = rawPath;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return fallback;
  }

  // Reject control chars and backslashes: the URL parser normalizes "\" to "/",
  // so "/\evil.com" would otherwise resolve to an off-site absolute URL.
  if (/[\u0000-\u001f\u007f\\]/.test(decoded)) return fallback;
  if (!INTERNAL_PATH_PATTERN.test(decoded)) return fallback;

  // Defense in depth: confirm the path stays same-origin when resolved.
  try {
    if (new URL(decoded, PLACEHOLDER_ORIGIN).origin !== PLACEHOLDER_ORIGIN) {
      return fallback;
    }
  } catch {
    return fallback;
  }

  return decoded;
}

export function buildAuthCallbackUrl(origin: string, nextPath: string) {
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", nextPath);
  return callbackUrl.toString();
}

/**
 * The safe `?next=` path from the current browser URL. Read at click time so
 * pages don't need useSearchParams (and a Suspense boundary) just for this.
 */
export function nextFromLocation(fallback = "/dashboard") {
  if (typeof window === "undefined") return fallback;
  return sanitizeRedirectPath(new URLSearchParams(window.location.search).get("next"), fallback);
}

import { isGatedFeature, limitReachedMessage } from "@/lib/usage/limits";

export { formatResetTime } from "@/lib/usage/limits";

type ErrorBody = {
  error?: unknown;
  message?: unknown;
  feature?: unknown;
  resetsAt?: unknown;
} | null | undefined;

/** True when the API says a daily allowance is used up. */
export function isDailyLimit(body: ErrorBody) {
  return body?.error === "DAILY_LIMIT_REACHED";
}

/**
 * The message to show for an API error body. Daily-limit errors are rebuilt
 * here so the reset time is in the reader's time zone, not the server's.
 */
export function apiErrorMessage(body: ErrorBody, fallback: string) {
  if (isDailyLimit(body) && isGatedFeature(body?.feature)) {
    const resetsAt = typeof body?.resetsAt === "string" ? body.resetsAt : null;
    return limitReachedMessage(body.feature, resetsAt);
  }
  return typeof body?.message === "string" && body.message ? body.message : fallback;
}

/** Toast title for an API error code, so limit and busy errors read differently from failures. */
export function errorTitle(code: string | undefined, fallback: string) {
  if (code === "DAILY_LIMIT_REACHED") return "Daily limit reached";
  if (code === "BUSY") return "Busy right now";
  if (code === "RATE_LIMITED") return "Slow down a little";
  return fallback;
}

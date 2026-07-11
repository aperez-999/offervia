import * as Sentry from "@sentry/nextjs";

export function captureServerException(
  error: unknown,
  context: {
    route: string;
    extras?: Record<string, unknown>;
  }
) {
  return Sentry.withScope((scope) => {
    scope.setTag("route", context.route);
    if (context.extras) {
      Object.entries(context.extras).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
  });
}

export function captureClientException(
  error: unknown,
  context: {
    scope: string;
    extras?: Record<string, unknown>;
  }
) {
  return Sentry.withScope((s) => {
    s.setTag("scope", context.scope);
    if (context.extras) {
      Object.entries(context.extras).forEach(([key, value]) => {
        s.setExtra(key, value);
      });
    }
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
  });
}

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "BAD_REQUEST"
  | "INVALID_INPUT"
  | "RATE_LIMITED"
  | "DAILY_LIMIT_REACHED"
  | "BUSY"
  | "SERVER_ERROR";

export function ok<T>(data: T, init?: ResponseInit) {
  return Response.json({ success: true, data }, { status: 200, ...init });
}

export function created<T>(data: T, init?: ResponseInit) {
  return Response.json({ success: true, data }, { status: 201, ...init });
}

export function fail(
  code: ApiErrorCode,
  message: string,
  status: number,
  init?: ResponseInit & { extra?: Record<string, unknown> }
) {
  const { extra, ...rest } = init ?? {};
  return Response.json({ ...extra, error: code, message }, { status, ...rest });
}

/** The model provider is out of capacity for the moment. Never counts against a user. */
export function busy(extra?: Record<string, unknown>) {
  return fail(
    "BUSY",
    "Lots of people are using this right now. Wait a minute and try again.",
    503,
    { headers: { "Retry-After": "60" }, extra }
  );
}


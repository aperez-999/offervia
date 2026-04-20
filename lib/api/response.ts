export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "BAD_REQUEST"
  | "INVALID_INPUT"
  | "RATE_LIMITED"
  | "PLAN_LIMIT_REACHED"
  | "SERVER_ERROR";

export function ok<T>(data: T, init?: ResponseInit) {
  return Response.json({ success: true, data }, { status: 200, ...init });
}

export function created<T>(data: T, init?: ResponseInit) {
  return Response.json({ success: true, data }, { status: 201, ...init });
}

export function fail(code: ApiErrorCode, message: string, status: number, init?: ResponseInit) {
  return Response.json({ error: code, message }, { status, ...init });
}


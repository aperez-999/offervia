export type SafeFetchErrorCause = "timeout" | "network" | "server" | "client" | "unknown";

export type SafeFetchResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; status?: number; cause: SafeFetchErrorCause };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isJsonResponse(res: Response) {
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json");
}

export interface SafeFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: BodyInit | null;
  timeoutMs?: number;         // default 20000
  retries?: number;           // default 0 (POSTs usually shouldn't retry)
  retryDelayMs?: number;      // default 600
  signal?: AbortSignal | null;
}

export async function safeFetchJson<T = any>(
  url: string,
  {
    method = "POST",
    headers,
    body,
    timeoutMs = 20000,
    retries = 0,
    retryDelayMs = 600,
    signal,
  }: SafeFetchOptions = {}
): Promise<SafeFetchResult<T>> {
  let attempts = 0;

  while (true) {
    attempts += 1;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const combinedSignal = mergeSignals(signal, controller.signal);

    try {
      const res = await fetch(url, { method, headers, body, signal: combinedSignal });

      clearTimeout(timeout);

      if (!res.ok) {
        // Try to extract error message
        let msg = res.statusText || "Request failed";
        if (isJsonResponse(res)) {
          try {
            const json = await res.json();
            msg = json?.error || msg;
          } catch {}
        } else {
          try {
            const text = await res.text();
            if (text) msg = text.slice(0, 2000);
          } catch {}
        }

        const cause: SafeFetchErrorCause = res.status >= 500 ? "server" : "client";
        return { ok: false, error: msg, status: res.status, cause };
      }

      // Parse JSON safely
      let data: any = null;
      if (isJsonResponse(res)) {
        data = await res.json();
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          // not JSON, return text
          data = text as any;
        }
      }

      return { ok: true, data, status: res.status };
    } catch (err: any) {
      clearTimeout(timeout);

      // Abort?
      if (err?.name === "AbortError") {
        if (attempts <= retries) {
          await sleep(retryDelayMs);
          continue;
        }
        return { ok: false, error: "Request timed out", cause: "timeout" };
      }

      // Network?
      if (attempts <= retries) {
        await sleep(retryDelayMs);
        continue;
      }
      return { ok: false, error: "Network error. Please try again.", cause: "network" };
    }
  }
}

export async function postJson<T = any>(
  url: string,
  json: any,
  opts?: Omit<SafeFetchOptions, "body" | "method">
) {
  return safeFetchJson<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(opts?.headers || {}) },
    body: JSON.stringify(json ?? {}),
    ...opts,
  });
}

export async function postForm<T = any>(
  url: string,
  form: FormData,
  opts?: Omit<SafeFetchOptions, "body" | "method">
) {
  // NOTE: do NOT set Content-Type for FormData; browser will set boundary
  return safeFetchJson<T>(url, {
    method: "POST",
    body: form,
    ...opts,
  });
}

function mergeSignals(a: AbortSignal | null | undefined, b: AbortSignal) {
  if (!a) return b;
  // If dev wants to pass their own signal + our timeout signal, unify them.
  // Simple approach: if either aborts, we abort via a new controller.
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  a.addEventListener("abort", onAbort, { once: true });
  b.addEventListener("abort", onAbort, { once: true });
  return controller.signal;
}
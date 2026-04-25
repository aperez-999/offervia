export type SafeFetchErrorCause =
  | "timeout"
  | "network"
  | "server"
  | "client"
  | "unknown";

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
  timeoutMs?: number; // default 20000
  retries?: number; // default 0
  retryDelayMs?: number; // default 600
  signal?: AbortSignal | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            msg = json?.message || json?.error || msg;
          } catch {
            // ignore JSON parsing failure
          }
        } else {
          try {
            const text = await res.text();
            if (text) msg = text.slice(0, 2000);
          } catch {
            // ignore text extraction failure
          }
        }

        const cause: SafeFetchErrorCause = res.status >= 500 ? "server" : "client";
        return { ok: false, error: msg, status: res.status, cause };
      }

      // Parse JSON safely
      let data: unknown = null;
      if (isJsonResponse(res)) {
        data = await res.json();
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      // ✅ Fix: cast unknown to T
      return { ok: true, data: data as T, status: res.status };
    } catch (err: unknown) {
      clearTimeout(timeout);

      if (err instanceof Error && err.name === "AbortError") {
        if (attempts <= retries) {
          await sleep(retryDelayMs);
          continue;
        }
        return { ok: false, error: "Request timed out", cause: "timeout" };
      }

      if (attempts <= retries) {
        await sleep(retryDelayMs);
        continue;
      }
      return { ok: false, error: "Network error. Please try again.", cause: "network" };
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function postJson<T = any>(
  url: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export async function getJson<T = unknown>(
  url: string,
  opts?: Omit<SafeFetchOptions, "body" | "method">
) {
  return safeFetchJson<T>(url, {
    method: "GET",
    ...opts,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function postForm<T = any>(
  url: string,
  form: FormData,
  opts?: Omit<SafeFetchOptions, "body" | "method">
) {
  return safeFetchJson<T>(url, {
    method: "POST",
    body: form,
    ...opts,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function patchJson<T = any>(
  url: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any,
  opts?: Omit<SafeFetchOptions, "body" | "method">
) {
  return safeFetchJson<T>(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(opts?.headers || {}) },
    body: JSON.stringify(json ?? {}),
    ...opts,
  });
}

export async function deleteJson<T = unknown>(
  url: string,
  opts?: Omit<SafeFetchOptions, "body" | "method">
) {
  return safeFetchJson<T>(url, {
    method: "DELETE",
    ...opts,
  });
}

function mergeSignals(a: AbortSignal | null | undefined, b: AbortSignal) {
  if (!a) return b;
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  a.addEventListener("abort", onAbort, { once: true });
  b.addEventListener("abort", onAbort, { once: true });
  return controller.signal;
}

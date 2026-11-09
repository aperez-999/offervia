import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: string[] = [];
let currentUser: { id: string } | null = { id: "user-1" };
let deleteUserError: unknown = null;

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: async () => ({ user: currentUser, error: null }),
}));
vi.mock("@/lib/monitoring/sentry", () => ({ captureServerException: () => {} }));
vi.mock("@/lib/supabase/service", () => ({
  getServiceSupabase: () => ({
    storage: {
      from: () => ({
        list: async (prefix: string) => {
          calls.push(`list:${prefix}`);
          return { data: [{ name: "a.png" }], error: null };
        },
        remove: async (paths: string[]) => {
          calls.push(`remove:${paths.join(",")}`);
          return { error: null };
        },
      }),
    },
    from: (table: string) => ({
      delete: () => ({
        eq: async (col: string, val: string) => {
          calls.push(`delete:${table}:${col}=${val}`);
          return { error: null };
        },
      }),
    }),
    auth: {
      admin: {
        deleteUser: async (id: string) => {
          calls.push(`deleteUser:${id}`);
          return { error: deleteUserError };
        },
      },
    },
  }),
}));

import { DELETE } from "./route";
import { DELETE_CONFIRMATION } from "@/lib/account";

const req = (body: unknown) =>
  new Request("http://localhost/api/account", { method: "DELETE", body: JSON.stringify(body) });

describe("DELETE /api/account", () => {
  beforeEach(() => {
    calls.length = 0;
    currentUser = { id: "user-1" };
    deleteUserError = null;
  });

  it("refuses signed-out requests", async () => {
    currentUser = null;
    const res = await DELETE(req({ confirm: DELETE_CONFIRMATION }));
    expect(res.status).toBe(401);
    expect(calls).toEqual([]);
  });

  it("refuses without the typed confirmation", async () => {
    const res = await DELETE(req({ confirm: "yes" }));
    expect(res.status).toBe(400);
    expect(calls).toEqual([]);
  });

  it("removes files and logs, then the user, only for the signed-in id", async () => {
    const res = await DELETE(req({ confirm: "Delete My Account " }));
    expect(res.status).toBe(200);
    expect(calls).toEqual([
      "list:user-1",
      "remove:user-1/a.png",
      "delete:request_events:user_id=user-1",
      "deleteUser:user-1",
    ]);
  });

  it("reports a failure instead of claiming success", async () => {
    deleteUserError = new Error("boom");
    const res = await DELETE(req({ confirm: DELETE_CONFIRMATION }));
    expect(res.status).toBe(500);
  });
});

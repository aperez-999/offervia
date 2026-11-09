import { describe, expect, it } from "vitest";

import { sanitizeRedirectPath } from "@/lib/auth/redirect";

describe("sanitizeRedirectPath", () => {
  it("allows safe internal paths", () => {
    expect(sanitizeRedirectPath("/dashboard")).toBe("/dashboard");
  });

  it("blocks absolute and protocol-relative paths", () => {
    expect(sanitizeRedirectPath("https://evil.test")).toBe("/dashboard");
    expect(sanitizeRedirectPath("//evil.test")).toBe("/dashboard");
  });

  it("falls back on malformed encoded values", () => {
    expect(sanitizeRedirectPath("%E0%A4%A", "/login")).toBe("/login");
  });
});

describe("nextFromLocation", () => {
  it("reads a safe next path from the URL and rejects off-site ones", async () => {
    const { nextFromLocation } = await import("@/lib/auth/redirect");
    window.history.replaceState(null, "", "/signup?next=%2Fbullet-check");
    expect(nextFromLocation()).toBe("/bullet-check");
    window.history.replaceState(null, "", "/signup?next=https%3A%2F%2Fevil.example");
    expect(nextFromLocation()).toBe("/dashboard");
    window.history.replaceState(null, "", "/signup");
    expect(nextFromLocation()).toBe("/dashboard");
  });
});

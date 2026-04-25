import { describe, expect, it } from "vitest";

import { sanitizeRedirectPath } from "@/lib/auth/redirect";

describe("sanitizeRedirectPath", () => {
  it("allows safe internal paths", () => {
    expect(sanitizeRedirectPath("/dashboard?login=1")).toBe("/dashboard?login=1");
  });

  it("blocks absolute and protocol-relative paths", () => {
    expect(sanitizeRedirectPath("https://evil.test")).toBe("/dashboard?login=1");
    expect(sanitizeRedirectPath("//evil.test")).toBe("/dashboard?login=1");
  });

  it("falls back on malformed encoded values", () => {
    expect(sanitizeRedirectPath("%E0%A4%A", "/login")).toBe("/login");
  });
});

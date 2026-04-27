import { describe, expect, it } from "vitest";

import { getAuthErrorMessage, isObfuscatedExistingSignupResponse } from "@/lib/auth/errors";

describe("getAuthErrorMessage", () => {
  it("sanitizes common login provider errors", () => {
    expect(getAuthErrorMessage(new Error("Invalid login credentials"), "login")).toBe(
      "We couldn't sign you in with those credentials."
    );
  });

  it("sanitizes duplicate signup errors", () => {
    expect(getAuthErrorMessage(new Error("User already registered"), "signup")).toBe(
      "An account with that email already exists."
    );
  });

  it("detects Supabase's obfuscated existing-user signup response", () => {
    expect(
      isObfuscatedExistingSignupResponse({
        session: null,
        user: { identities: [] },
      })
    ).toBe(true);
  });
});

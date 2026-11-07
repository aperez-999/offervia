import { describe, expect, it } from "vitest";
import { apiErrorMessage, formatResetTime, isDailyLimit } from "@/lib/usage/client";

const now = new Date("2026-11-04T18:00:00Z");

describe("formatResetTime", () => {
  it("uses a plain time for later today", () => {
    expect(formatResetTime("2026-11-04T20:40:00Z", { now, timeZone: "UTC" })).toBe("at 8:40 PM");
  });

  it("says tomorrow for the next day", () => {
    expect(formatResetTime("2026-11-05T09:15:00Z", { now, timeZone: "UTC" })).toBe(
      "tomorrow at 9:15 AM"
    );
  });
});

describe("apiErrorMessage", () => {
  it("rebuilds daily-limit messages with the reset time", () => {
    const msg = apiErrorMessage(
      {
        error: "DAILY_LIMIT_REACHED",
        feature: "cover_letter",
        // Relative to the real clock so the test never goes stale.
        resetsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        message: "server text",
      },
      "fallback"
    );
    expect(msg).toMatch(/^You've used today's \d+ cover letters\. Your next one frees up (tomorrow )?at \d/);
  });

  it("uses the server message for other errors", () => {
    expect(apiErrorMessage({ error: "BUSY", message: "Busy right now." }, "fallback")).toBe("Busy right now.");
  });

  it("falls back when there is no message", () => {
    expect(apiErrorMessage(null, "fallback")).toBe("fallback");
    expect(isDailyLimit(undefined)).toBe(false);
  });
});

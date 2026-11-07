import { describe, expect, it } from "vitest";
import {
  ALLOWANCE_WINDOW_MS,
  DAILY_LIMITS,
  GATED_FEATURES,
  allowanceStatus,
  limitReachedMessage,
  remainingNote,
} from "@/lib/usage/limits";

const now = new Date("2026-11-04T18:00:00Z");
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000);

describe("DAILY_LIMITS", () => {
  it("gives every feature a positive whole number", () => {
    for (const f of GATED_FEATURES) {
      expect(Number.isInteger(DAILY_LIMITS[f])).toBe(true);
      expect(DAILY_LIMITS[f]).toBeGreaterThan(0);
    }
  });
});

describe("allowanceStatus", () => {
  it("has full room with no history", () => {
    expect(allowanceStatus([], 3, now)).toEqual({ used: 0, remaining: 3, limit: 3, resetsAt: null });
  });

  it("counts uses inside the window", () => {
    const s = allowanceStatus([ago(10), ago(60)], 3, now);
    expect(s.used).toBe(2);
    expect(s.remaining).toBe(1);
    expect(s.resetsAt).toBeNull();
  });

  it("ignores uses older than 24 hours and bad timestamps", () => {
    const s = allowanceStatus([ago(24 * 60 + 1), "not a date", ago(5).toISOString()], 3, now);
    expect(s.used).toBe(1);
  });

  it("reports when the oldest use frees up once full", () => {
    const oldest = ago(23 * 60);
    const s = allowanceStatus([ago(1), oldest, ago(30)], 3, now);
    expect(s.remaining).toBe(0);
    expect(s.resetsAt?.getTime()).toBe(oldest.getTime() + ALLOWANCE_WINDOW_MS);
  });

  it("picks the right slot when over the limit", () => {
    // Four uses against a limit of 3 (e.g. the limit was lowered). The user
    // needs two to expire, so the reset is the second-oldest + 24h.
    const uses = [ago(600), ago(500), ago(400), ago(300)];
    const s = allowanceStatus(uses, 3, now);
    expect(s.resetsAt?.getTime()).toBe(ago(500).getTime() + ALLOWANCE_WINDOW_MS);
  });
});

describe("limitReachedMessage", () => {
  it("names the time in the reader's zone", () => {
    const resetsAt = new Date("2026-11-04T20:40:00Z");
    expect(limitReachedMessage("resume_tailor", resetsAt, { now, timeZone: "UTC" })).toBe(
      `You've used today's ${DAILY_LIMITS.resume_tailor} resume drafts. Your next one frees up at 8:40 PM.`
    );
  });

  it("says tomorrow when the reset is on a later day", () => {
    const resetsAt = new Date("2026-11-05T09:15:00Z");
    expect(limitReachedMessage("coach", resetsAt, { now, timeZone: "UTC" })).toMatch(
      /frees up tomorrow at 9:15 AM\.$/
    );
  });

  it("falls back when the time is missing", () => {
    expect(limitReachedMessage("job_scan", null)).toMatch(/More open up within 24 hours\.$/);
  });
});

describe("remainingNote", () => {
  it("stays quiet while there's plenty left", () => {
    expect(remainingNote("resume_tailor", 5, null)).toBeNull();
    expect(remainingNote("resume_tailor", 4, null)).toBeNull();
  });

  it("counts down when few are left", () => {
    expect(remainingNote("resume_tailor", 3, null)).toBe("3 left today");
    expect(remainingNote("resume_tailor", 1, null)).toBe("1 left today");
  });

  it("explains the reset at zero", () => {
    const note = remainingNote("cover_letter", 0, "2026-11-04T20:40:00Z", { now, timeZone: "UTC" });
    expect(note).toBe(`You've used today's ${DAILY_LIMITS.cover_letter} cover letters. Your next one frees up at 8:40 PM.`);
  });
});

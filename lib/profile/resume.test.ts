import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_RESUME_CHARS, normalizeResumeText, readSavedResume } from "@/lib/profile/resume";

function fakeSupabase(result: { data?: unknown; error?: unknown; throws?: boolean }) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: async () => {
      if (result.throws) throw new Error("network");
      return { data: result.data ?? null, error: result.error ?? null };
    },
  };
  return { from: () => chain } as unknown as SupabaseClient;
}

describe("readSavedResume", () => {
  it("returns the saved text", async () => {
    const r = await readSavedResume(
      fakeSupabase({ data: { resume_text: "Jordan Rivera\nBuilt things", resume_updated_at: "2026-11-01T00:00:00Z" } }),
      "u1"
    );
    expect(r).toEqual({ available: true, text: "Jordan Rivera\nBuilt things", updatedAt: "2026-11-01T00:00:00Z" });
  });

  it("treats blank text as nothing saved", async () => {
    const r = await readSavedResume(fakeSupabase({ data: { resume_text: "   ", resume_updated_at: null } }), "u1");
    expect(r).toEqual({ available: true, text: null, updatedAt: null });
  });

  it("is unavailable when the column is missing or the call fails", async () => {
    const missing = await readSavedResume(fakeSupabase({ error: { code: "42703", message: "column does not exist" } }), "u1");
    expect(missing.available).toBe(false);
    const thrown = await readSavedResume(fakeSupabase({ throws: true }), "u1");
    expect(thrown.available).toBe(false);
  });
});

describe("normalizeResumeText", () => {
  it("tidies whitespace and caps the length", () => {
    expect(normalizeResumeText("  Name  \r\n\r\n\r\n\r\nSkills \n")).toBe("Name\n\nSkills");
    expect(normalizeResumeText("x".repeat(MAX_RESUME_CHARS + 50)).length).toBe(MAX_RESUME_CHARS);
  });
});

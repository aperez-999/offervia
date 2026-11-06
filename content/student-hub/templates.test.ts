import { describe, expect, it } from "vitest";
import { TEMPLATES, renderTemplate } from "@/content/student-hub/templates";

describe("renderTemplate", () => {
  it("fills known variables", () => {
    expect(renderTemplate("Hi {{contact}}, I'm {{name}}.", { contact: "Sam", name: " Ana " })).toBe("Hi Sam, I'm Ana.");
  });

  it("leaves readable placeholders for blanks instead of empty gaps", () => {
    expect(renderTemplate("Hi {{contact}}, I'm {{name}}, a {{role}}.", {})).toBe(
      "Hi [their name], I'm [your name], a [role]."
    );
    expect(renderTemplate("{{unknown}}", { unknown: "  " })).toBe("[unknown]");
  });

  it("only uses variables every template knows how to label", () => {
    for (const t of TEMPLATES) {
      for (const [, k] of t.body.matchAll(/\{\{(\w+)\}\}/g)) {
        expect(["name", "role", "company", "contact", "portfolio"]).toContain(k);
      }
    }
  });
});

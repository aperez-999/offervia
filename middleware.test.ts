import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import path from "node:path";
import { config, PROTECTED_PREFIXES } from "./middleware";

describe("middleware route lists", () => {
  it("matches every protected prefix", () => {
    for (const prefix of PROTECTED_PREFIXES) {
      expect(config.matcher).toContain(`${prefix}/:path*`);
    }
  });

  it("has no matcher entries without a protected prefix (besides the home page)", () => {
    const extras = config.matcher.filter(
      (m) => m !== "/" && !PROTECTED_PREFIXES.some((p) => m === `${p}/:path*`)
    );
    expect(extras).toEqual([]);
  });

  it("protects every page folder under app/(protected)", () => {
    const dir = path.join(__dirname, "app", "(protected)");
    const folders = readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => `/${d.name}`);
    for (const folder of folders) {
      expect(PROTECTED_PREFIXES).toContain(folder);
    }
  });
});

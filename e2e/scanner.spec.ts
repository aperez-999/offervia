import { expect, test } from "@playwright/test";

import { HAS_AUTH_ENV, login } from "@/e2e/helpers";

// These tests exercise the scanner form's client-side enable guard without
// triggering an actual AI scan, so they stay fast and never spend Groq quota.
test.describe("ATS keyword scanner", () => {
  test.skip(!HAS_AUTH_ENV, "Set E2E_EMAIL and E2E_PASSWORD to enable scanner tests.");

  test("scan button stays disabled until resume and job description are long enough", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await login(page);

    await page.goto("/scanner");
    await expect(
      page.getByRole("heading", { name: /ats keyword scanner/i }),
    ).toBeVisible({ timeout: 15_000 });

    const scanButton = page.getByRole("button", { name: /scan for keywords/i });
    await expect(scanButton).toBeDisabled();

    const resume = page.getByPlaceholder("Paste your resume text here…");
    const jd = page.getByPlaceholder("Paste the job description you're applying to…");

    // Too short — still disabled.
    await resume.fill("Frontend engineer");
    await jd.fill("React role");
    await expect(scanButton).toBeDisabled();

    // Meets the 50-char resume / 20-char JD thresholds — now enabled.
    await resume.fill(
      "Senior frontend engineer with eight years of React, TypeScript, and Next.js experience.",
    );
    await jd.fill(
      "We are hiring a senior React engineer to build accessible, performant web apps.",
    );
    await expect(scanButton).toBeEnabled();
  });
});

import { expect, test } from "@playwright/test";

import { HAS_AUTH_ENV, login } from "@/e2e/helpers";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /turn job descriptions into interviews/i })).toBeVisible({
    timeout: 15_000,
  });
});

test("dashboard redirects signed-out users to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test.describe("authenticated smoke", () => {
  test.skip(!HAS_AUTH_ENV, "Set E2E_EMAIL and E2E_PASSWORD to enable authenticated smoke tests.");

  test("signed-in user can reach dashboard and core workflow pages", async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);

    const routes = [
      { path: "/dashboard", heading: /dashboard|welcome/i },
      { path: "/job-packet", heading: /job packet/i },
      { path: "/resume", heading: /resume tailor/i },
      { path: "/tracker", heading: /job tracker/i },
      { path: "/coach", heading: /interview coach|resume feedback|cover letter help|career advice/i },
      { path: "/settings", heading: /settings/i },
      { path: "/profile", heading: /profile/i },
      { path: "/resources", heading: /student resources/i },
      { path: "/templates", heading: /templates/i },
      { path: "/students", heading: /student exclusives/i },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await expect(page).toHaveURL(new RegExp(route.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
    }
  });
});

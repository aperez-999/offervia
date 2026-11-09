import { expect, test } from "@playwright/test";

import { HAS_AUTH_ENV, login, uniqueLabel } from "@/e2e/helpers";

test.describe("tracker workflow", () => {
  test.skip(!HAS_AUTH_ENV, "Set E2E_EMAIL and E2E_PASSWORD to enable tracker E2E coverage.");

  test("signed-in user can quick add and remove an application", async ({ page }) => {
    await login(page);
    await page.goto("/tracker");
    await expect(page.getByRole("heading", { name: "Tracker", exact: true })).toBeVisible();

    const company = uniqueLabel("PW Company");
    const position = uniqueLabel("PW Role");
    const today = new Date().toISOString().slice(0, 10);

    await page.getByPlaceholder("Company", { exact: true }).fill(company);
    await page.getByPlaceholder("Position", { exact: true }).fill(position);
    await page.locator('input[type="date"]').first().fill(today);
    await page.getByRole("button", { name: /^add$/i }).click();

    const row = page.getByRole("row").filter({ hasText: company });
    await expect(row).toBeVisible();

    await row.getByRole("button", { name: /^delete$/i }).click();
    await page.getByRole("button", { name: /^delete$/i }).last().click();

    await expect(row).toHaveCount(0);
  });
});

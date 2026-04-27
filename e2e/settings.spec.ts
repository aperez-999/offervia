import { expect, test } from "@playwright/test";

import { HAS_AUTH_ENV, login } from "@/e2e/helpers";

test.describe("settings workflow", () => {
  test.skip(!HAS_AUTH_ENV, "Set E2E_EMAIL and E2E_PASSWORD to enable settings E2E coverage.");

  test("signed-in user can save preferences", async ({ page }) => {
    await login(page);
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();

    const weeklyGoalInput = page.locator('input[type="number"]').first();
    const weeklyGoal = String((Date.now() % 9) + 3);

    await weeklyGoalInput.fill(weeklyGoal);
    await page.getByRole("button", { name: /^save settings$/i }).click();

    await expect(page.getByText("Settings saved")).toBeVisible();

    await page.reload();
    await expect(weeklyGoalInput).toHaveValue(weeklyGoal);
  });
});

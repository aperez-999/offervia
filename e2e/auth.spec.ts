import { expect, test } from "@playwright/test";

import { E2E_EMAIL, E2E_PASSWORD, HAS_AUTH_ENV, login } from "@/e2e/helpers";

test.describe("auth flows", () => {
  test.skip(!HAS_AUTH_ENV, "Set E2E_EMAIL and E2E_PASSWORD to enable authenticated auth tests.");

  test("password login reaches the dashboard", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("signup surfaces an existing-account error for known users", async ({ page }) => {
    await page.goto("/signup");
    await expect(
      page.getByRole("heading", { name: /create your offervia account/i })
    ).toBeVisible({ timeout: 15_000 });
    await page.getByPlaceholder("Your name").fill("Playwright Existing User");
    await page.getByPlaceholder("you@example.com").fill(E2E_EMAIL!);
    await page.getByPlaceholder("Enter at least 6 characters").fill(E2E_PASSWORD!);
    await page.getByPlaceholder("Make sure passwords match").fill(E2E_PASSWORD!);
    await page.getByRole("button", { name: /^create account$/i }).click();

    await expect(page.getByText("An account with that email already exists.")).toBeVisible();
  });
});

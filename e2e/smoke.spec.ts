import { expect, test, type Page } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

async function login(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(email!);
  await page.getByPlaceholder("Enter your password").fill(password!);
  await page.getByRole("button", { name: /sign in/i }).click();
}

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("dashboard redirects signed-out users to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test.describe("authenticated smoke", () => {
  test.skip(!email || !password, "Set E2E_EMAIL and E2E_PASSWORD to enable authenticated smoke tests.");

  test("signed-in user can reach dashboard and core workflow pages", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/job-packet");
    await expect(page.getByRole("heading", { name: /job packet/i })).toBeVisible();

    await page.goto("/resume");
    await expect(page.getByRole("heading", { name: /resume tailor/i })).toBeVisible();

    await page.goto("/tracker");
    await expect(page.getByRole("heading", { name: /job tracker/i })).toBeVisible();

    await page.goto("/coach");
    await expect(page.getByRole("heading", { name: /interview coach|resume feedback|cover letter help|career advice/i })).toBeVisible();
  });
});

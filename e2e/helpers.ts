import { expect, type Page } from "@playwright/test";

export const E2E_EMAIL = process.env.E2E_EMAIL?.trim();
export const E2E_PASSWORD = process.env.E2E_PASSWORD?.trim();
export const HAS_AUTH_ENV = Boolean(E2E_EMAIL && E2E_PASSWORD);

export async function login(page: Page) {
  if (!E2E_EMAIL || !E2E_PASSWORD) {
    throw new Error("Missing E2E_EMAIL or E2E_PASSWORD.");
  }

  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(E2E_EMAIL);
  await page.getByPlaceholder("Enter your password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}

export function uniqueLabel(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

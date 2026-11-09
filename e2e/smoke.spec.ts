import { expect, test } from "@playwright/test";

import { HAS_AUTH_ENV, login } from "@/e2e/helpers";

const PUBLIC_PAGES = ["/", "/login", "/signup", "/privacy"];

const PROTECTED_ROUTES = [
  "/dashboard",
  "/dashboard/insights",
  "/student-hub",
  "/bullet-check",
  "/offers",
  "/interview",
  "/cover-letter",
  "/documents",
];

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /see what the job asks for/i })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("heading", { name: /plus a student hub/i })).toBeVisible();
  // The home page stays short: no FAQ or long tool lists.
  await expect(page.getByRole("heading", { name: /questions people ask/i })).toHaveCount(0);
});


for (const path of PUBLIC_PAGES) {
  test(`${path} fits a phone screen without sideways scrolling`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(path);
    await page.waitForLoadState("load");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

for (const path of PROTECTED_ROUTES) {
  test(`${path} sends signed-out users to login and keeps the destination`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path).replace(/%2F/g, "(%2F|/)")}`));
  });
}

test("the old upgrade page is gone", async ({ page }) => {
  const res = await page.goto("/upgrade");
  expect(res?.status()).toBe(404);
});

test.describe("authenticated smoke", () => {
  test.skip(!HAS_AUTH_ENV, "Set E2E_EMAIL and E2E_PASSWORD to enable authenticated smoke tests.");

  test("signed-in user can reach dashboard and core workflow pages", async ({ page }) => {
    test.setTimeout(90_000);
    await login(page);

    const routes = [
      { path: "/dashboard", heading: /^hi|welcome back/i },
      { path: "/dashboard/insights", heading: /insights/i },
      { path: "/job-packet", heading: /new application/i },
      { path: "/resume", heading: /tailor your resume/i },
      { path: "/scanner", heading: /keyword scan/i },
      { path: "/bullet-check", heading: /bullet check/i },
      { path: "/cover-letter", heading: /cover letter/i },
      { path: "/documents", heading: /saved/i },
      { path: "/interview", heading: /mock interview/i },
      { path: "/coach", heading: /ask a coach/i },
      { path: "/tracker", heading: /tracker/i },
      { path: "/offers", heading: /compare offers/i },
      { path: "/student-hub", heading: /student hub/i },
      { path: "/settings", heading: /settings/i },
      { path: "/profile", heading: /profile/i },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await expect(page).toHaveURL(new RegExp(route.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible();
    }
  });

  test("home stays short and links to insights", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/upgrade|today's limits/i)).toHaveCount(0);
    const insights = page.getByRole("link", { name: "See insights" });
    if (await insights.count()) {
      await insights.click();
      await expect(page).toHaveURL(/\/dashboard\/insights/);
    }
  });

  test("the sidebar has six sections and tabs switch pages", async ({ page }) => {
    await login(page);
    await page.goto("/resume");
    const main = page.getByRole("navigation", { name: "Main" }).first();
    await expect(main.getByRole("link")).toHaveCount(6);
    await page.getByRole("navigation", { name: "Resume & letters" }).getByRole("link", { name: "Keyword scan" }).click();
    await expect(page).toHaveURL(/\/scanner/);
    await expect(page.getByRole("link", { name: "Keyword scan" })).toHaveAttribute("aria-current", "page");
  });

  test("My resume pre-fills the scanner", async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);
    await page.goto("/profile");
    const card = page.locator("#my-resume");
    await expect(card).toBeVisible();
    test.skip(
      (await card.getByText(/isn't set up on this server yet/).count()) > 0,
      "Run db/migrations/08_saved_resume.sql to enable My resume."
    );
    const box = card.getByLabel("Your resume text");
    await expect(box).toBeEnabled();
    const original = await box.inputValue();
    await box.fill(
      `Jordan Rivera\nFrontend developer\n\nExperience\nBuilt a React dashboard used by 2,000 students to plan their courses.\nCut page load time by 30% by splitting bundles.\nTest run ${Date.now()}`
    );
    await card.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("My resume saved")).toBeVisible();

    await page.goto("/scanner");
    await expect(page.getByText(/Using\s*My resume/)).toBeVisible();

    // Put things back the way they were.
    await page.goto("/profile");
    if (original.trim()) {
      await card.getByLabel("Your resume text").fill(original);
      await card.getByRole("button", { name: "Save" }).click();
    } else {
      await card.getByRole("button", { name: "Remove" }).click();
    }
  });

  test("offer compare highlights the better offer", async ({ page }) => {
    await login(page);
    await page.goto("/offers");
    const base = page.getByLabel("Base salary (yearly)");
    const rent = page.getByLabel("Monthly rent there");
    await base.nth(0).fill("90k");
    await rent.nth(0).fill("2800");
    await base.nth(1).fill("$78,000");
    await rent.nth(1).fill("1400");
    const table = page.getByRole("table");
    await expect(table).toBeVisible();
    await expect(table.locator(".hl").first()).toBeVisible();
  });
});

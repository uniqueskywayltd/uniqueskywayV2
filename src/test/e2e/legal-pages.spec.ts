import { expect, test } from "@playwright/test";

test.describe("sprint A5 legal and recovery", () => {
  test("renders Privacy with counsel banner and classifications", async ({ page }) => {
    await page.goto("/legal/privacy");
    await expect(page.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeVisible();
    await expect(page.getByText("Subject to legal counsel review")).toBeVisible();
    await expect(page.getByText("Requires legal counsel review").first()).toBeVisible();
    await expect(page.getByText("ISO 27001 certified", { exact: false })).toHaveCount(0);
  });

  test("renders full legal suite routes", async ({ page }) => {
    for (const path of [
      "/legal/terms",
      "/legal/risk",
      "/legal/aml",
      "/legal/kyc",
      "/legal/cookies",
    ]) {
      await page.goto(path);
      await expect(page.getByText("Subject to legal counsel review")).toBeVisible();
      await expect(page.locator("h1")).toBeVisible();
    }
  });

  test("renders professional 404 recovery experience", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-wave-a");
    await expect(
      page.getByRole("heading", { level: 1, name: "This page is unavailable." }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Return home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Search the FAQ" })).toBeVisible();
    await expect(page.getByText("oopsie", { exact: false })).toHaveCount(0);
  });
});

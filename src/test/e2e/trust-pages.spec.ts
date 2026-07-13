import { expect, test } from "@playwright/test";

test.describe("sprint A3 trust experience", () => {
  test("renders About with credibility purpose", async ({ page }) => {
    await page.goto("/about");
    await expect(
      page.getByRole("heading", { level: 1, name: "Built for clarity and stewardship." }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Who we are" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Our philosophy" })).toBeVisible();
    await expect(page.getByText("Gold Trafigura")).toHaveCount(0);
    await expect(page.getByText("sovereign wealth", { exact: false })).toHaveCount(0);
  });

  test("renders How It Works with simple journey steps", async ({ page }) => {
    await page.goto("/how-it-works");
    await expect(
      page.getByRole("heading", { level: 1, name: "A calm path from account to withdrawal." }),
    ).toBeVisible();
    await expect(page.locator("#main-content").getByText("Create account", { exact: true })).toBeVisible();
    await expect(page.locator("#main-content").getByText("Withdraw funds", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Statuses you may see" })).toBeVisible();
  });

  test("renders Security without invented certifications", async ({ page }) => {
    await page.goto("/security");
    await expect(
      page.getByRole("heading", { level: 1, name: "Protection is a practice—not a slogan." }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "What we never do" })).toBeVisible();
    await expect(page.getByText("ISO certified", { exact: false })).toHaveCount(0);
    await expect(page.getByText("SOC 2 certified", { exact: false })).toHaveCount(0);
    await expect(page.getByText("risk-free returns", { exact: false })).toBeVisible();
  });
});

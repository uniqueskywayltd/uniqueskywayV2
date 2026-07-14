import { expect, test } from "@playwright/test";

test.describe("sprint A2 homepage", () => {
  test("renders the platform homepage composition", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("region", { name: "Homepage banner" })).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: "Where vision meets measurable growth." }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Start investing" }).first()).toBeVisible();
    await expect(page.getByRole("region", { name: "Platform highlights" })).toBeVisible();
    await expect(page.getByRole("region", { name: "What we do" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Diversified investment services" })).toBeVisible();
    await expect(
      page.getByRole("region", {
        name: "Explain why the company exists and why it is different.",
      }),
    ).toBeVisible();
    await expect(page.getByRole("region", { name: "Show how simple the process is." })).toBeVisible();
    await expect(
      page.getByRole("region", {
        name: "Introduce investment opportunities without overwhelming details.",
      }),
    ).toBeVisible();
    await expect(page.getByText("Plans will appear when published")).toBeVisible();
    await expect(page.getByText("Returns are not guaranteed").first()).toBeVisible();
    await expect(page.getByRole("region", { name: "Remove initial skepticism." })).toBeVisible();
    await expect(page.getByRole("region", { name: "Answer “Is my money safe?”" })).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Resolve the most common objections." }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Encourage registration with confidence." }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Create free account" }).first()).toBeVisible();
  });

  test("keeps the public shell on the homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });
});

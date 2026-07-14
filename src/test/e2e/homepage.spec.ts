import { expect, test } from "@playwright/test";

test.describe("sprint A2 homepage", () => {
  test("renders the flagship homepage sections", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("region", { name: "Homepage banner" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "UniqueSkyWay" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "CREATE AN ACCOUNT" }).first()).toBeVisible();

    await expect(page.getByRole("region", { name: "Remove initial skepticism." })).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Explain why the company exists and why it is different." }),
    ).toBeVisible();
    await expect(page.getByRole("region", { name: "Show how simple the process is." })).toBeVisible();
    await expect(
      page.getByRole("region", {
        name: "Introduce investment opportunities without overwhelming details.",
      }),
    ).toBeVisible();
    await expect(page.getByRole("region", { name: "Answer “Is my money safe?”" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Build long-term credibility." })).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Resolve the most common objections." }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Encourage registration with confidence." }),
    ).toBeVisible();

    await expect(page.getByText("Returns are not guaranteed.")).toBeVisible();
    await expect(page.getByText("Plans will appear when published")).toBeVisible();
  });

  test("keeps the public shell on the homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });
});

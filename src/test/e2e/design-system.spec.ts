import { expect, test } from "@playwright/test";

test("design system showcase renders the Phase 2 foundation", async ({ page }) => {
  await page.goto("/design-system");

  await expect(
    page.getByRole("heading", { name: "Premium UI foundation for every future page." }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Design Tokens" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Primary" })).toBeVisible();
  await expect(page.getByText("$12,500.00")).toBeVisible();
});

import { expect, test } from "@playwright/test";

test.describe("sprint A2 homepage", () => {
  test("renders the platform homepage composition", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("region", { name: "Homepage banner" })).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: "Where vision meets measurable growth." }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Start investing" }).first()).toBeVisible();
    await expect(page.getByText("$24,850").first()).toBeVisible();
    await expect(page.getByRole("region", { name: "Platform highlights" })).toBeVisible();
    await expect(page.getByText("$250M+").first()).toBeVisible();
    await expect(page.getByRole("region", { name: "What we do" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Diversified investment services" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Why Unique Sky Way" })).toBeVisible();
    await expect(page.getByRole("region", { name: "How it works" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Investment plans" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Silver Plan" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Gold Plan" }).first()).toBeVisible();
    await expect(page.getByRole("region", { name: "Client testimonials" })).toBeVisible();
    await expect(page.getByText("Sarah Mitchell").first()).toBeVisible();
    await expect(page.getByRole("region", { name: "Get started" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Get started" }).getByRole("heading")).toBeVisible();
    await expect(page.getByRole("link", { name: "Create free account" }).first()).toBeVisible();
  });

  test("keeps the public shell on the homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "About" }),
    ).toBeVisible();
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "Investments" })).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });
});

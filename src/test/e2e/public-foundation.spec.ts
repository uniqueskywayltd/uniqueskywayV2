import { expect, test } from "@playwright/test";

test.describe("sprint A1 public foundation", () => {
  test("renders public shell navigation and footer", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Unique Sky Way" }).first()).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Plans" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Open account" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page.getByRole("link", { name: "Skip to main content" })).toBeAttached();
    await expect(
      page.getByRole("region", { name: "Illustrative exchange rates — not live" }),
    ).toBeVisible();
    await expect(page.getByText(/©\s*\d{4}\s*Unique Sky Way/i).first()).toBeVisible();
    await expect(page.getByText("info@uniqueskyway.com").first()).toBeVisible();
    await expect(page.getByText("Fayetteville, Arkansas").first()).toBeVisible();
  });

  test("supports mobile navigation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "FAQ" }),
    ).toBeVisible();
  });

  test("exposes robots and sitemap framework", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBeTruthy();
    const robotsBody = await robots.text();
    expect(robotsBody).toContain("Sitemap:");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    const sitemapBody = await sitemap.text();
    expect(sitemapBody).toContain("<urlset");
    expect(sitemapBody).toContain("auth/login");
  });
});

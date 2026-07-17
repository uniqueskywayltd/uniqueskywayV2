import { expect, test } from "@playwright/test";

test.describe("sprint A1 public foundation", () => {
  test("renders public shell navigation and footer", async ({ page }) => {
    await page.goto("/");
    await page.waitForResponse(
      (response) => response.url().includes("/api/market-ticker") && response.ok(),
      { timeout: 15_000 },
    );
    await expect(page.getByRole("link", { name: "Unique Sky Way" }).first()).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "About" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "Contact" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Open account" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "Investments" }),
    ).toBeVisible();
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "How It Works" }),
    ).toBeVisible();
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "FAQ" })).toBeVisible();
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "Referrals" }),
    ).toBeVisible();
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "Security" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Skip to main content" })).toBeAttached();
    await expect(page.getByRole("region", { name: "Market overview" })).toBeVisible();
    await expect(page.getByText("Illustrative — not live")).toHaveCount(0);
    await expect(page.getByText(/©\s*\d{4}\s*Unique Sky Way/i).first()).toBeVisible();
    await expect(page.getByText("info@uniqueskyway.com").first()).toBeVisible();
    await expect(page.getByText("Fayetteville, Arkansas").first()).toBeVisible();
  });

  test("supports mobile navigation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open navigation" }).click();
    const mobileNav = page.getByRole("navigation", { name: "Mobile navigation" });
    await expect(mobileNav).toBeVisible();
    for (const label of [
      "Home",
      "About",
      "Investments",
      "How It Works",
      "Referrals",
      "FAQ",
      "Security",
      "Contact",
    ]) {
      await expect(mobileNav.getByRole("link", { name: label })).toBeVisible();
    }
  });

  test("blocks search indexing via robots and empty sitemap", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBeTruthy();
    const robotsBody = await robots.text();
    expect(robotsBody).toContain("Disallow: /");
    expect(robotsBody).not.toContain("Sitemap:");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    const sitemapBody = await sitemap.text();
    expect(sitemapBody).toContain("<urlset");
    expect(sitemapBody).not.toContain("auth/login");
  });
});

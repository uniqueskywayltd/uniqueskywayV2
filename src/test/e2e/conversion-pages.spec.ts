import { expect, test } from "@playwright/test";

test.describe("sprint A4 conversion experience", () => {
  test("renders Plans with certified catalog placeholders", async ({ page }) => {
    await page.goto("/plans");
    await expect(
      page.getByRole("heading", { level: 1, name: "Compare with clarity." }),
    ).toBeVisible();
    await expect(page.getByText("Plans will appear when published")).toBeVisible();
    await expect(page.getByText("15% ROI", { exact: false })).toHaveCount(0);
    await expect(page.getByText("guaranteed return", { exact: false })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Risk note" })).toBeVisible();
  });

  test("renders FAQ groups and supports search", async ({ page }) => {
    await page.goto("/faq");
    await expect(
      page.getByRole("heading", { level: 1, name: "Answers without the noise." }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Getting Started" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Withdrawals" })).toBeVisible();

    await page.getByLabel("Search").fill("deposits");
    await expect(page.getByText("How do deposits work?")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Getting Started" })).toHaveCount(0);
  });

  test("renders Contact with pending channels and working intake", async ({ page }) => {
    await page.goto("/contact");
    await expect(
      page.getByRole("heading", { level: 1, name: "Ask clearly. We answer calmly." }),
    ).toBeVisible();
    await expect(page.getByText("Pending approval").first()).toBeVisible();
    await expect(page.getByText("+1-", { exact: false })).toHaveCount(0);

    await page.getByLabel("Full name").fill("Alex Investor");
    await page.getByLabel("Email").fill("alex@example.com");
    await page.getByLabel("Topic").selectOption("Plans");
    await page.getByLabel("Message").fill("I would like to understand how plans are published.");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Message received.")).toBeVisible();
  });
});

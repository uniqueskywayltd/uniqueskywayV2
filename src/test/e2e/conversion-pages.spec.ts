import { expect, test } from "@playwright/test";

test.describe("sprint A4 conversion experience", () => {
  test("renders Plans with certified catalog", async ({ page }) => {
    await page.goto("/plans");
    await expect(
      page.getByRole("heading", { level: 1, name: "Plans built for every portfolio size" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Silver Plan" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Gold Plan" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Classic Plan" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Master Plan" }).first()).toBeVisible();
    await expect(page.getByText("guaranteed return", { exact: false })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "What you should understand" })).toBeVisible();
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

  test("renders Contact intake without pending channel cards", async ({ page }) => {
    await page.goto("/contact");
    await expect(
      page.getByRole("heading", { level: 1, name: "Ask clearly. We answer calmly." }),
    ).toBeVisible();
    await expect(page.getByText("Pending approval")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Channels" })).toHaveCount(0);
    await expect(page.getByText("+1-", { exact: false })).toHaveCount(0);
    await expect(page.getByRole("group", { name: /\d+ plus \d+/ })).toBeVisible();

    await page.getByLabel("Full name").fill("Alex Investor");
    await page.getByLabel("Email").fill("alex@example.com");
    await page.getByLabel("Topic").selectOption("Plans");
    await page.getByLabel("Message").fill("I would like to understand how plans are published.");
    const captcha = page.getByRole("group", { name: /\d+ plus \d+/ });
    const equation = (await captcha.getAttribute("aria-label")) ?? "";
    const match = equation.match(/(\d+) plus (\d+)/);
    expect(match).toBeTruthy();
    const sum = Number(match?.[1]) + Number(match?.[2]);
    await page.getByLabel("Answer").fill(String(sum));
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Message received.")).toBeVisible();
  });
});

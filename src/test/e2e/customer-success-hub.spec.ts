import { expect, test } from "@playwright/test";

test.describe("sprint G1 customer success hub", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/customer/summary", async (route) => {
      await route.fulfill({
        json: {
          data: {
            user: {
              id: "app_user_1",
              email: "investor@example.com",
              emailVerifiedAt: "2026-07-13T07:00:00.000Z",
              status: "active",
            },
            profile: {
              id: "profile_1",
              userId: "app_user_1",
              legalName: "Avery Investor",
              displayName: "Avery",
              phone: null,
              country: "US",
              stateRegion: "NY",
              dateOfBirth: null,
              avatarStoragePath: null,
              avatarContentType: null,
              avatarUpdatedAt: null,
              onboardingStatus: "not_started",
              kycStatus: "not_started",
              riskStatus: "not_reviewed",
              avatarUrl: null,
            },
            account: {
              id: "account_1",
              accountNumber: "USW-123",
              status: "active",
              restrictionReason: null,
              openedAt: "2026-07-13T07:00:00.000Z",
            },
            preferences: {
              id: "preferences_1",
              userId: "app_user_1",
              appearance: "system",
              language: "en",
              timeZone: "America/New_York",
              inAppNotificationsEnabled: true,
              securityEmailsEnabled: true,
              productEmailsEnabled: true,
              marketingEmailsEnabled: false,
            },
            notificationPreferences: {
              inApp: { account: true, security: true, product: true },
              email: { security: true, product: true, marketing: false },
            },
            unreadNotificationCount: 0,
          },
        },
      });
    });
  });

  test("success hub answers how to become more successful", async ({ page }) => {
    await page.goto("/account/success");
    await expect(page.getByRole("heading", { level: 1, name: "Success" })).toBeVisible();
    await expect(
      page.getByText("How can I become more successful? Guidance without reinventing your money home."),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Progress framework" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open" }).first()).toBeVisible();
  });

  test("learning, milestones, and statements shells are reachable", async ({ page }) => {
    await page.goto("/account/learn");
    await expect(page.getByRole("heading", { level: 1, name: "Learning" })).toBeVisible();
    await expect(page.getByText("Coming in Sprint G3").first()).toBeVisible();

    await page.goto("/account/milestones");
    await expect(page.getByRole("heading", { level: 1, name: "Milestones" })).toBeVisible();
    await expect(page.getByText("no streaks", { exact: false })).toBeVisible();

    await page.route("**/api/customer/statements**", async (route) => {
      await route.fulfill({
        json: {
          data: {
            timezone: "America/New_York",
            projectedAt: "2026-07-13T12:00:00.000Z",
            scanLimit: 200,
            understanding: "These statements help you understand your financial history.",
            statements: [],
            downloads: [],
            emptyHint: "No posted activity to statement yet.",
          },
        },
      });
    });

    await page.goto("/account/statements");
    await expect(page.getByRole("heading", { level: 1, name: "Statements" })).toBeVisible();
    await expect(
      page.getByText("Can I understand my financial history? Ledger-backed projections — not invented totals."),
    ).toBeVisible();
  });

  test("account nav exposes Success without replacing money nav", async ({ page }) => {
    await page.goto("/account/success");
    await expect(page.getByRole("navigation", { name: "Customer navigation" })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Customer navigation" }).getByRole("link", {
        name: "Success",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Customer navigation" }).getByRole("link", {
        name: "Dashboard",
      }),
    ).toBeVisible();
  });
});

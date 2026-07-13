import { expect, test } from "@playwright/test";

test.describe("customer experience foundation", () => {
  test.beforeEach(async ({ page }) => {
    await mockCustomerApis(page);
  });

  test("renders the authenticated customer shell and account pages", async ({ page }) => {
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: "Account", exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Customer navigation" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Profile/ })).toBeVisible();
    await expect(page.getByText("Unread notifications")).toBeVisible();

    await page.goto("/account/profile");
    await expect(page.getByRole("heading", { name: "Profile", exact: true })).toBeVisible();
    await expect(page.getByLabel("Legal name")).toBeVisible();
    await expect(page.getByLabel("Display name")).toBeVisible();

    await page.goto("/account/preferences");
    await expect(page.getByRole("heading", { name: "Preferences", exact: true })).toBeVisible();
    await expect(page.getByLabel("Appearance preference")).toBeVisible();
    await expect(page.getByLabel("Time zone preference")).toBeVisible();

    await page.goto("/account/security");
    await expect(page.getByRole("heading", { name: "Security", exact: true })).toBeVisible();
    await expect(page.getByLabel("Current password")).toBeVisible();
    await expect(page.getByRole("link", { name: "Trusted devices" })).toBeVisible();
  });

  test("supports notification search and activity timeline", async ({ page }) => {
    await page.goto("/account/notifications");
    await expect(page.getByRole("heading", { name: "Notifications", exact: true })).toBeVisible();
    await expect(page.getByLabel("Search notifications")).toBeVisible();
    await expect(page.getByText("Welcome to Unique Sky Way")).toBeVisible();

    await page.goto("/account/activity");
    await expect(page.getByRole("heading", { name: "Activity", exact: true })).toBeVisible();
    await expect(page.getByText("Customer Profile Updated")).toBeVisible();
  });

  test("uses mobile navigation on small screens", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/account/profile");

    await expect(page.getByRole("button", { name: "Toggle navigation" })).toBeVisible();
    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await expect(
      page.getByRole("navigation", { name: "Customer mobile navigation" }),
    ).toBeVisible();
    await page.getByRole("link", { name: /Activity/ }).click();
    await expect(page).toHaveURL(/\/account\/activity$/);
  });

  test("renders customer error, maintenance, offline, and forbidden surfaces", async ({ page }) => {
    await page.goto("/forbidden");
    await expect(page.getByRole("heading", { name: "Access restricted" })).toBeVisible();

    await page.goto("/maintenance");
    await expect(page.getByRole("heading", { name: "Maintenance in progress" })).toBeVisible();

    await page.goto("/offline");
    await expect(page.getByRole("heading", { name: "You are offline" })).toBeVisible();
  });
});

async function mockCustomerApis(page: import("@playwright/test").Page) {
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
          unreadNotificationCount: 1,
        },
      },
    });
  });

  await page.route("**/api/customer/notifications**", async (route) => {
    await route.fulfill({
      json: {
        data: {
          unreadCount: 1,
          notifications: [
            {
              id: "notification_1",
              type: "account",
              title: "Welcome to Unique Sky Way",
              body: "Your account experience is ready.",
              priority: "info",
              readAt: null,
              createdAt: "2026-07-13T07:00:00.000Z",
            },
          ],
        },
      },
    });
  });

  await page.route("**/api/customer/activity", async (route) => {
    await route.fulfill({
      json: {
        data: {
          activity: [
            {
              id: "audit:1",
              type: "audit",
              title: "Customer Profile Updated",
              detail: "customer_profile",
              createdAt: "2026-07-13T07:00:00.000Z",
            },
          ],
        },
      },
    });
  });
}

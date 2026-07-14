import { expect, test } from "@playwright/test";

test.describe("Bundle 1 Profile & Security", () => {
  test.beforeEach(async ({ page }) => {
    await mockAccountApis(page);
  });

  test("renders account hub on DashboardShell", async ({ page }) => {
    await page.goto("/account");
    await expect(page.getByRole("heading", { level: 1, name: "Account" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Dashboard navigation" }).first()).toBeVisible();
    await expect(page.locator("#main-content")).toBeVisible();
    await expect(page.getByRole("region", { name: "Account controls navigation" })).toBeVisible();
    await expect(page.getByText("What you can control")).toBeVisible();
    await expect(page.getByRole("link", { name: /Profile/ }).first()).toBeVisible();
  });

  test("renders profile personal information and avatar controls", async ({ page }) => {
    await page.goto("/account/profile");
    await expect(page.getByRole("heading", { level: 1, name: "Profile" })).toBeVisible();
    await expect(page.getByLabel("Legal name")).toBeVisible();
    await expect(page.getByLabel("Display name")).toBeVisible();
    await expect(page.getByText("Account information")).toBeVisible();
    await expect(page.getByText("USW-123", { exact: true })).toBeVisible();
  });

  test("renders preferences theme and language controls", async ({ page }) => {
    await page.goto("/account/preferences");
    await expect(page.getByRole("heading", { level: 1, name: "Preferences" })).toBeVisible();
    await expect(page.getByLabel("Appearance preference")).toBeVisible();
    await expect(page.getByLabel("Time zone preference")).toBeVisible();
    await expect(page.getByLabel("Language preference")).toBeVisible();
  });

  test("renders security password devices sessions and tips", async ({ page }) => {
    await page.goto("/account/security");
    await expect(page.getByRole("heading", { level: 1, name: "Security" })).toBeVisible();
    await expect(page.getByLabel("Current password")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Trusted devices" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Active sessions" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Security tips" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open devices" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open sessions" })).toBeVisible();
  });

  test("uses dashboard mobile navigation on account profile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/account/profile");
    await expect(page.getByRole("button", { name: "Open navigation menu" })).toBeVisible();
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await expect(page.getByText("Dashboard navigation")).toBeVisible();
    await page.getByRole("link", { name: "Security" }).click();
    await expect(page).toHaveURL(/\/account\/security$/);
  });
});

async function mockAccountApis(page: import("@playwright/test").Page) {
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

  await page.route("**/api/customer/referrals", async (route) => {
    await route.fulfill({
      json: {
        data: {
          code: { code: "INVITE1", status: "active", createdAt: "2026-07-13T07:00:00.000Z" },
          share: { url: null, text: null, disclaimer: "" },
          guidance: [],
          summary: {
            referralCount: 0,
            qualifiedCount: 0,
            pendingCount: 0,
            rewardedCount: 0,
            postedRewardCount: 0,
            pendingRewardCount: 0,
            postedRewardAmountMinor: "0",
          },
          referrals: [],
          rewards: [],
          links: {
            learnHref: "/account/learn",
            helpHref: "/account/help",
            ledgerHref: "/ledger",
            successHref: "/account/success",
          },
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
              id: "sec:1",
              type: "security",
              category: "security",
              title: "New sign-in detected",
              detail: "security_event",
              createdAt: "2026-07-13T07:00:00.000Z",
            },
          ],
        },
      },
    });
  });

  await page.route("**/api/auth/trusted-devices", async (route) => {
    await route.fulfill({
      json: {
        data: {
          devices: [
            {
              id: "trusted_device_1",
              label: "Mac browser",
              lastUsedAt: "2026-07-12T12:00:00.000Z",
              expiresAt: "2027-01-08T12:00:00.000Z",
              revokedAt: null,
              createdAt: "2026-07-01T12:00:00.000Z",
            },
          ],
        },
      },
    });
  });

  await page.route("**/api/auth/sessions", async (route) => {
    await route.fulfill({
      json: {
        data: {
          sessions: [
            {
              id: "session_1",
              status: "active",
              lastSeenAt: "2026-07-12T12:00:00.000Z",
              expiresAt: "2026-07-12T13:00:00.000Z",
              revokedAt: null,
              createdAt: "2026-07-12T11:00:00.000Z",
              current: true,
            },
          ],
        },
      },
    });
  });

  await page.route("**/api/customer/notifications**", async (route) => {
    await route.fulfill({
      json: {
        data: {
          unreadCount: 1,
          notifications: [],
        },
      },
    });
  });
}

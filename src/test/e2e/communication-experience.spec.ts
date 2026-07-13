import { expect, test } from "@playwright/test";

test.describe("sprint B4 communication experience", () => {
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
            unreadNotificationCount: 2,
          },
        },
      });
    });

    await page.route("**/api/customer/notifications**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.fulfill({ json: { data: { markAll: true, updatedCount: 2 } } });
        return;
      }

      await route.fulfill({
        json: {
          data: {
            unreadCount: 2,
            notifications: [
              {
                id: "n_security",
                type: "security.new_device",
                title: "New device signed in",
                body: "A new trusted-device check needs your review.",
                priority: "critical",
                category: "security",
                href: "/account/security",
                readAt: null,
                createdAt: "2026-07-13T15:00:00.000Z",
                isToday: true,
              },
              {
                id: "n_deposit",
                type: "deposit.confirmed",
                title: "Deposit available",
                body: "Funds were confirmed and credited.",
                priority: "success",
                category: "financial",
                href: "/wallet/deposits/dep_1",
                readAt: null,
                createdAt: "2026-07-12T15:00:00.000Z",
                isToday: false,
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
                id: "a1",
                type: "audit",
                category: "financial",
                title: "Deposit Created",
                detail: "deposit_intent",
                createdAt: "2026-07-13T12:00:00.000Z",
              },
              {
                id: "a2",
                type: "security",
                category: "security",
                title: "New Device",
                detail: "warning",
                createdAt: "2026-07-13T11:00:00.000Z",
              },
            ],
          },
        },
      });
    });

    await page.route("**/api/customer/referrals", async (route) => {
      await route.fulfill({
        json: {
          data: {
            code: {
              id: "code_1",
              code: "SKY-AVERY",
              status: "active",
              isDefault: true,
              createdAt: "2026-07-01T00:00:00.000Z",
            },
            codes: [],
            summary: {
              referralCount: 1,
              qualifiedCount: 1,
              pendingCount: 0,
              postedRewardCount: 1,
              pendingRewardCount: 0,
              postedRewardAmountMinor: "2500",
            },
            referrals: [],
            rewards: [
              {
                id: "rw_1",
                currency: "USD",
                amountMinor: "2500",
                status: "posted",
                postedAt: "2026-07-10T00:00:00.000Z",
                createdAt: "2026-07-10T00:00:00.000Z",
              },
            ],
          },
        },
      });
    });
  });

  test("renders notification center answering what to know now", async ({ page }) => {
    await page.goto("/account/notifications");
    await expect(page.getByRole("heading", { level: 1, name: "Notifications" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Security" })).toBeVisible();
    await expect(page.getByText("New device signed in")).toBeVisible();
    await expect(page.getByText("Today")).toBeVisible();
    await expect(page.getByText("Earlier")).toBeVisible();
    await expect(page.getByRole("link", { name: "Notification preferences" })).toBeVisible();
  });

  test("supports help search, referrals, and communication hub", async ({ page }) => {
    await page.goto("/account/help");
    await expect(page.getByRole("heading", { level: 1, name: "Help Center" })).toBeVisible();
    await page.getByLabel("Search help articles").fill("accrued");
    await expect(page.getByRole("heading", { name: "Accrued earnings vs credited earnings" })).toBeVisible();

    await page.goto("/account/referrals");
    await expect(page.getByText("SKY-AVERY")).toBeVisible();

    await page.goto("/account/communications");
    await expect(page.getByRole("heading", { level: 1, name: "Communication Center" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What’s New" })).toBeVisible();
  });

  test("refines activity with financial/security filters", async ({ page }) => {
    await page.goto("/account/activity");
    await expect(page.getByRole("heading", { level: 1, name: "Activity" })).toBeVisible();
    await page.getByRole("button", { name: "Financial" }).click();
    await expect(page.getByText("Deposit Created")).toBeVisible();
    await page.getByRole("button", { name: "Security" }).click();
    await expect(page.getByText("New Device")).toBeVisible();
  });
});

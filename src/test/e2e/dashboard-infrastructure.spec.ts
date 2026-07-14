import { expect, test } from "@playwright/test";

test.describe("dashboard DP1–DP2 frame and money cards", () => {
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

    await page.route("**/api/customer/wallet", async (route) => {
      await route.fulfill({
        json: {
          data: {
            balances: {
              currency: "USD",
              availableBalanceMinor: "12000",
              pendingBalanceMinor: "500",
              lockedBalanceMinor: "25000",
              reservedBalanceMinor: "0",
              withdrawnBalanceMinor: "0",
              withdrawableBalanceMinor: "12000",
              lastEntryAt: null,
            },
            vocabulary: [],
            recentActivity: [],
            recentDeposits: [],
            recentWithdrawals: [],
            pendingDepositCount: 1,
            openWithdrawalCount: 0,
          },
        },
      });
    });

    await page.route("**/api/customer/investments**", async (route) => {
      await route.fulfill({
        json: {
          data: {
            summary: {
              totalCount: 2,
              byStatus: { active: 1, pending: 1, maturing: 0, matured: 0, cancelled: 0, failed: 0 },
              activePrincipalMinor: "25000",
            },
            investments: [],
          },
        },
      });
    });

    await page.route("**/api/customer/ledger", async (route) => {
      await route.fulfill({
        json: {
          data: {
            currency: "USD",
            entries: [
              {
                id: "led_1",
                transactionType: "deposit_confirmation",
                label: "Deposit credited",
                referenceType: "deposit",
                referenceId: "dep_1",
                description: null,
                amountMinor: "12000",
                direction: "credit",
                currency: "USD",
                walletCategory: "available",
                postedAt: "2026-07-13T12:00:00.000Z",
                href: "/ledger",
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
            notifications: [
              {
                id: "notif_1",
                type: "security.login",
                title: "New sign-in detected",
                body: "A new session was created for your account.",
                priority: "high",
                category: "security",
                href: "/account/security",
                readAt: null,
                createdAt: "2026-07-13T14:00:00.000Z",
                isToday: true,
              },
            ],
            unreadCount: 1,
          },
        },
      });
    });
  });

  test("renders platform-aligned dashboard frame", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1, name: "Avery" })).toBeVisible();
    await expect(page.getByText("@USW-123")).toBeVisible();
    await expect(page.getByRole("region", { name: "Welcome" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Quick actions" })).toBeVisible();
  });

  test("exposes dashboard navigation shell", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("navigation", { name: "Dashboard navigation" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Overview" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Investments" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Wallet" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Ledger" }).first()).toBeVisible();
  });

  test("exposes platform quick actions with V3 routes", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: "Deposit" })).toHaveAttribute(
      "href",
      "/wallet/deposits/new",
    );
    await expect(page.getByRole("link", { name: "Withdraw" })).toHaveAttribute(
      "href",
      "/wallet/withdrawals/new",
    );
    const quickActions = page.getByRole("region", { name: "Quick actions" });
    await expect(quickActions.getByRole("link", { name: "Investments" })).toHaveAttribute(
      "href",
      "/portfolio",
    );
    await expect(quickActions.getByRole("link", { name: "Wallet" })).toHaveAttribute(
      "href",
      "/wallet",
    );
  });

  test("renders certified money cards", async ({ page }) => {
    await page.goto("/dashboard");

    const portfolio = page.getByRole("region", { name: "Portfolio balances" });
    await expect(portfolio.getByText("Portfolio value")).toBeVisible();
    await expect(portfolio.getByText("$250.00")).toBeVisible();
    await expect(portfolio.getByText("Available balance")).toBeVisible();
    await expect(portfolio.getByText("$120.00")).toBeVisible();
    await expect(portfolio.getByText("Locked balance")).toBeVisible();
    await expect(portfolio.getByText("$250.00").nth(1)).toBeVisible();
    await expect(portfolio.getByText("Pending balance")).toBeVisible();
    await expect(portfolio.getByText("$5.00")).toBeVisible();

    const summary = page.getByRole("region", { name: "Investment summary" });
    await expect(summary.getByText("Active investments")).toBeVisible();
    await expect(summary.getByText("1", { exact: true }).first()).toBeVisible();
    await expect(summary.getByText("Pending deposits")).toBeVisible();
    await expect(summary.getByText("Open withdrawals")).toBeVisible();
  });

  test("renders certified activity and notifications", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByText("You have 1 unread notification.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Review alerts" })).toHaveAttribute(
      "href",
      "/account/notifications",
    );

    const activity = page.getByRole("region", { name: "Activity" });
    await expect(activity.getByText("Recent activity")).toBeVisible();
    await expect(activity.getByText("Deposit credited")).toBeVisible();
    await expect(activity.getByText("Notifications")).toBeVisible();
    await expect(activity.getByText("New sign-in detected")).toBeVisible();
    await expect(activity.getByText("1", { exact: true }).first()).toBeVisible();
  });
});

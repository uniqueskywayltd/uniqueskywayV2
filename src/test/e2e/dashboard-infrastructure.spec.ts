import { expect, test } from "@playwright/test";

test.describe("sprint B1 dashboard infrastructure", () => {
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
              pendingBalanceMinor: "0",
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
            pendingDepositCount: 0,
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
              totalCount: 1,
              byStatus: { active: 1, pending: 0, maturing: 0, matured: 0, cancelled: 0, failed: 0 },
              activePrincipalMinor: "25000",
            },
            investments: [
              {
                id: "inv_1",
                planName: "Growth Plan",
                currency: "USD",
                principalMinor: "25000",
                postedRoiMinor: "0",
                termDays: 30,
                status: "active",
                startAt: null,
                firstSettlementDate: null,
                maturityDate: "2026-08-01",
                activatedAt: null,
                maturedAt: null,
                cancelledAt: null,
                createdAt: "2026-07-01T00:00:00.000Z",
                progressPercent: 40,
                nextMilestone: { label: "Next settlement cue", date: "2026-07-14" },
              },
            ],
          },
        },
      });
    });

    await page.route("**/api/customer/notifications**", async (route) => {
      await route.fulfill({
        json: { data: { notifications: [], unreadCount: 0 } },
      });
    });
  });

  test("renders dashboard widget framework in financial hierarchy order", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("How you’re doing today", { exact: false })).toBeVisible();

    const portfolio = page.locator('[data-widget-id="portfolio-value"]');
    const available = page.locator('[data-widget-id="available-balance"]');
    await expect(portfolio).toBeVisible();
    await expect(available).toBeVisible();
    await expect(portfolio).toHaveAttribute("data-hierarchy-rank", "1");
    await expect(available).toHaveAttribute("data-hierarchy-rank", "2");
    await expect(portfolio.getByText("$250.00")).toBeVisible();
    await expect(available.getByText("$120.00")).toBeVisible();
  });

  test("exposes money navigation and shell routes", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("navigation", { name: "Customer navigation" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Portfolio" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Wallet" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Ledger" }).first()).toBeVisible();

    await page.goto("/portfolio");
    await expect(page.getByRole("heading", { level: 1, name: "Portfolio" })).toBeVisible();
    await page.goto("/wallet");
    await expect(page.getByRole("heading", { level: 1, name: "Wallet" })).toBeVisible();
    await page.goto("/ledger");
    await expect(page.getByRole("heading", { level: 1, name: "Ledger" })).toBeVisible();
  });

  test("enables quick money actions for Sprint B3 journeys", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: "Add funds" })).toHaveAttribute(
      "href",
      "/wallet/deposits/new",
    );
    await expect(page.getByRole("link", { name: "Withdraw" })).toHaveAttribute(
      "href",
      "/wallet/withdrawals/new",
    );
  });
});

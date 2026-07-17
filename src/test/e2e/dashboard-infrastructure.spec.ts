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
              currency: "USD",
              portfolioValueMinor: "37500",
              todayEarningsMinor: "1148",
              totalEarningsMinor: "2148",
              totalRoiMinor: "1000",
              currentInvestmentValueMinor: "26148",
              nextSettlementCountdownSeconds: 3600,
            },
            investments: [
              {
                id: "inv_1",
                planName: "Growth Plan",
                currency: "USD",
                principalMinor: "25000",
                postedRoiMinor: "1000",
                promisedRoiMinor: "7500",
                dailyRoiBps: 300,
                termDays: 30,
                status: "active",
                startAt: "2026-07-01T00:00:00.000Z",
                firstSettlementDate: "2026-07-02",
                maturityDate: "2026-07-31",
                activatedAt: "2026-07-01T00:00:00.000Z",
                maturedAt: null,
                cancelledAt: null,
                createdAt: "2026-07-01T00:00:00.000Z",
                progressPercent: 40,
                nextMilestone: { label: "Next settlement", date: "2026-07-15" },
              },
              {
                id: "inv_2",
                planName: "Starter Plan",
                currency: "USD",
                principalMinor: "5000",
                postedRoiMinor: "0",
                termDays: 14,
                status: "pending",
                startAt: null,
                firstSettlementDate: null,
                maturityDate: null,
                activatedAt: null,
                maturedAt: null,
                cancelledAt: null,
                createdAt: "2026-07-13T00:00:00.000Z",
                progressPercent: 0,
                nextMilestone: { label: "Awaiting activation", date: null },
              },
            ],
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
    await expect(page.getByRole("region", { name: "Welcome" }).getByText("@USW-123")).toBeVisible();
    await expect(page.getByRole("region", { name: "Welcome" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Quick actions" })).toBeVisible();
    await expect(page.locator("#main-content")).toBeVisible();
    await expect(page.getByRole("link", { name: "Skip to main content" }).first()).toHaveAttribute(
      "href",
      "#main-content",
    );
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
    const quickActions = page.getByRole("region", { name: "Quick actions" });
    await expect(quickActions.getByRole("link", { name: "Deposit", exact: true })).toHaveAttribute(
      "href",
      "/wallet/deposits/new",
    );
    await expect(quickActions.getByRole("link", { name: "Withdraw", exact: true })).toHaveAttribute(
      "href",
      "/wallet/withdrawals/new",
    );
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

    await expect(page.getByRole("region", { name: "Live earnings" })).toBeVisible();
    await expect(page.getByText("Investment Active")).toBeVisible();
    await expect(page.getByText("Accrued Today")).toBeVisible();

    const portfolio = page.getByRole("region", { name: "Portfolio balances" });
    await expect(portfolio.getByText("Portfolio value")).toBeVisible();
    await expect(portfolio.getByRole("link", { name: /Portfolio value/ })).toContainText("$375.00");
    await expect(portfolio.getByText("Available balance")).toBeVisible();
    await expect(portfolio.getByText("$120.00")).toBeVisible();
    await expect(portfolio.getByText("Locked balance")).toBeVisible();
    await expect(portfolio.getByRole("link", { name: /Locked balance/ })).toContainText("$250.00");
    await expect(portfolio.getByText("Today's earnings")).toBeVisible();

    const summary = page.getByRole("region", { name: "Investment summary" });
    await expect(summary.getByText("Total ROI earned")).toBeVisible();
    await expect(summary.getByText("Active investments")).toBeVisible();
    await expect(summary.getByText("1", { exact: true }).first()).toBeVisible();
    await expect(summary.getByText("Pending deposits")).toBeVisible();
    await expect(summary.getByText("Pending withdrawals")).toBeVisible();
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

  test("renders certified investment widgets", async ({ page }) => {
    await page.goto("/dashboard");

    const investments = page.getByRole("region", { name: "Investments" });
    await expect(investments.getByText("Active principal")).toBeVisible();
    await expect(investments.getByText("Growth Plan")).toBeVisible();
    await expect(investments.getByText("Next settlement").first()).toBeVisible();
    await expect(investments.getByText("40%")).toBeVisible();
    await expect(investments.getByRole("link", { name: "View investments" })).toHaveAttribute(
      "href",
      "/portfolio",
    );
    await expect(page.getByRole("link", { name: /Growth Plan/i })).toHaveAttribute(
      "href",
      "/portfolio/inv_1",
    );
  });
});

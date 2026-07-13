import { expect, test } from "@playwright/test";

test.describe("sprint B3 wallet experience", () => {
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
            unreadNotificationCount: 1,
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
              availableBalanceMinor: "25000",
              pendingBalanceMinor: "5000",
              lockedBalanceMinor: "100000",
              reservedBalanceMinor: "0",
              withdrawnBalanceMinor: "0",
              withdrawableBalanceMinor: "25000",
              lastEntryAt: "2026-07-13T12:00:00.000Z",
            },
            vocabulary: [
              {
                id: "available",
                label: "Available",
                customerWording: "Spendable and withdrawable now.",
                source: "Ledger available cash (FI-200)",
              },
              {
                id: "accrued",
                label: "Accrued earnings",
                customerWording: "Scheduled but not credited — never available in the wallet.",
                source: "Investment schedule (Portfolio)",
              },
            ],
            recentActivity: [
              {
                id: "deposit:dep_1",
                kind: "deposit",
                title: "Deposit",
                amountMinor: "5000",
                currency: "USD",
                status: "pending",
                at: "2026-07-13T11:00:00.000Z",
                href: "/wallet/deposits/dep_1",
              },
            ],
            recentDeposits: [],
            recentWithdrawals: [],
            pendingDepositCount: 1,
            openWithdrawalCount: 0,
          },
        },
      });
    });

    await page.route("**/api/customer/deposits**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.match(/\/api\/customer\/deposits\/[^/]+$/)) {
        await route.fulfill({
          json: {
            data: {
              deposit: {
                id: "dep_1",
                provider: "paystack",
                currency: "USD",
                amountMinor: "5000",
                status: "pending",
                providerAuthorizationUrl: null,
                createdAt: "2026-07-13T10:00:00.000Z",
                confirmedAt: null,
                updatedAt: "2026-07-13T11:00:00.000Z",
              },
              timeline: [
                {
                  key: "created",
                  label: "Deposit created",
                  complete: true,
                  current: false,
                  at: "2026-07-13T10:00:00.000Z",
                  nextExpectedStep: "Complete payment if prompted.",
                },
                {
                  key: "pending",
                  label: "Awaiting confirmation",
                  complete: true,
                  current: true,
                  at: "2026-07-13T11:00:00.000Z",
                  nextExpectedStep: "Wait for provider or review confirmation.",
                },
                {
                  key: "confirmed",
                  label: "Available",
                  complete: false,
                  current: false,
                  at: null,
                  nextExpectedStep: "Use funds in wallet or invest.",
                },
              ],
              canCancel: true,
            },
          },
        });
        return;
      }

      await route.fulfill({
        json: {
          data: {
            deposits: [
              {
                id: "dep_1",
                provider: "paystack",
                currency: "USD",
                amountMinor: "5000",
                status: "pending",
                providerAuthorizationUrl: null,
                createdAt: "2026-07-13T10:00:00.000Z",
                confirmedAt: null,
                updatedAt: "2026-07-13T11:00:00.000Z",
              },
            ],
          },
        },
      });
    });

    await page.route("**/api/customer/withdrawals**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.match(/\/api\/customer\/withdrawals\/[^/]+$/)) {
        await route.fulfill({
          json: {
            data: {
              withdrawal: {
                id: "wd_1",
                currency: "USD",
                amountMinor: "10000",
                destinationType: "paystack_recipient",
                destinationReference: "RCP_1",
                status: "under_review",
                reviewReason: null,
                createdAt: "2026-07-12T10:00:00.000Z",
                paidAt: null,
                updatedAt: "2026-07-12T11:00:00.000Z",
              },
              timeline: [
                {
                  key: "requested",
                  label: "Requested",
                  complete: true,
                  current: false,
                  at: "2026-07-12T10:00:00.000Z",
                  nextExpectedStep: "Reservation or review begins.",
                },
                {
                  key: "under_review",
                  label: "Under review",
                  complete: true,
                  current: true,
                  at: null,
                  nextExpectedStep: "Wait for approve or reject.",
                },
              ],
              supportPath: { label: "Contact support", href: "/contact" },
            },
          },
        });
        return;
      }

      await route.fulfill({
        json: {
          data: {
            withdrawals: [
              {
                id: "wd_1",
                currency: "USD",
                amountMinor: "10000",
                destinationType: "paystack_recipient",
                destinationReference: "RCP_1",
                status: "under_review",
                reviewReason: null,
                createdAt: "2026-07-12T10:00:00.000Z",
                paidAt: null,
                updatedAt: "2026-07-12T11:00:00.000Z",
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
                id: "lt_1",
                transactionType: "deposit_confirmation",
                label: "Deposit credited",
                referenceType: "deposit_intent",
                referenceId: "dep_1",
                description: null,
                amountMinor: "25000",
                direction: "credit",
                currency: "USD",
                walletCategory: "available",
                postedAt: "2026-07-10T12:00:00.000Z",
                href: "/wallet/deposits/dep_1",
              },
            ],
          },
        },
      });
    });
  });

  test("renders wallet hierarchy answering how to safely move money", async ({ page }) => {
    await page.goto("/wallet");
    await expect(page.getByRole("heading", { level: 1, name: "Wallet" })).toBeVisible();
    await expect(page.getByText("Withdrawable now equals Available")).toBeVisible();
    await expect(page.getByText("Pending deposits")).toBeVisible();
    await expect(page.getByText("Locked funds")).toBeVisible();
    await expect(page.getByRole("link", { name: "Start deposit" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Start withdrawal" })).toBeVisible();
    await expect(page.getByText("Accrued earnings", { exact: true })).toBeVisible();
  });

  test("supports deposit history and anxiety-reducing withdrawal detail", async ({ page }) => {
    await page.goto("/wallet/deposits");
    await expect(page.getByRole("heading", { level: 1, name: "Funding history" })).toBeVisible();
    await page.getByRole("link", { name: /\$50\.00/ }).click();
    await expect(page).toHaveURL(/\/wallet\/deposits\/dep_1$/);
    await expect(page.getByText("Expected next step")).toBeVisible();

    await page.goto("/wallet/withdrawals/wd_1");
    await expect(page.getByText("Current status")).toBeVisible();
    await expect(page.getByText("Expected next step")).toBeVisible();
    await expect(page.getByText("Expected timeline")).toBeVisible();
    await expect(page.getByRole("link", { name: "Contact support" })).toBeVisible();
  });

  test("binds ledger to certified postings", async ({ page }) => {
    await page.goto("/ledger");
    await expect(page.getByRole("heading", { level: 1, name: "Ledger" })).toBeVisible();
    await expect(page.getByText("Deposit credited")).toBeVisible();
  });
});

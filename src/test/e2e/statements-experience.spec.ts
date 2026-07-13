import { expect, test } from "@playwright/test";

test.describe("sprint G2 statements experience", () => {
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

    await page.route("**/api/customer/statements?**", async (route) => {
      await route.fulfill({
        json: {
          data: {
            timezone: "America/New_York",
            projectedAt: "2026-07-13T12:00:00.000Z",
            scanLimit: 200,
            understanding:
              "These statements help you understand your financial history. Totals are summed from certified ledger postings.",
            statements: [
              {
                id: "monthly-2026-06",
                type: "monthly",
                typeLabel: "Monthly activity statement",
                periodKey: "2026-06",
                periodLabel: "June 2026",
                periodBounds: "2026-06-01 → 2026-06-30 (NY)",
                timezone: "America/New_York",
                status: "ready",
                statusLabel: "Ready",
                lineCount: 2,
                creditTotalMinor: "5100",
                debitTotalMinor: "0",
                projectedAt: "2026-07-13T12:00:00.000Z",
                href: "/account/statements/monthly-2026-06",
              },
            ],
            downloads: [],
            emptyHint: null,
          },
        },
      });
    });

    await page.route("**/api/customer/statements", async (route) => {
      if (route.request().url().includes("?")) {
        await route.fallback();
        return;
      }
      await route.fulfill({
        json: {
          data: {
            timezone: "America/New_York",
            projectedAt: "2026-07-13T12:00:00.000Z",
            scanLimit: 200,
            understanding:
              "These statements help you understand your financial history. Totals are summed from certified ledger postings.",
            statements: [
              {
                id: "monthly-2026-06",
                type: "monthly",
                typeLabel: "Monthly activity statement",
                periodKey: "2026-06",
                periodLabel: "June 2026",
                periodBounds: "2026-06-01 → 2026-06-30 (NY)",
                timezone: "America/New_York",
                status: "ready",
                statusLabel: "Ready",
                lineCount: 2,
                creditTotalMinor: "5100",
                debitTotalMinor: "0",
                projectedAt: "2026-07-13T12:00:00.000Z",
                href: "/account/statements/monthly-2026-06",
              },
            ],
            downloads: [],
            emptyHint: null,
          },
        },
      });
    });

    await page.route("**/api/customer/statements/monthly-2026-06", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ json: { data: { recorded: true } } });
        return;
      }
      await route.fulfill({
        json: {
          data: {
            id: "monthly-2026-06",
            type: "monthly",
            typeLabel: "Monthly activity statement",
            periodKey: "2026-06",
            periodLabel: "June 2026",
            periodBounds: "2026-06-01 → 2026-06-30 (NY)",
            timezone: "America/New_York",
            status: "ready",
            statusLabel: "Ready",
            projectedAt: "2026-07-13T12:00:00.000Z",
            understanding:
              "Totals match your ledger for this period. Period net activity is not your available balance.",
            footer: "Unique Sky Way statements project posted ledger activity. They are not tax advice.",
            summary: {
              creditTotalMinor: "5100",
              debitTotalMinor: "0",
              periodNetMinor: "5100",
              note: "Period net is credits minus debits for listed lines only — not available balance.",
            },
            categoryTotals: [
              { category: "available", creditTotalMinor: "5100", debitTotalMinor: "0" },
            ],
            lineCount: 1,
            lines: [
              {
                id: "tx_1",
                transactionType: "deposit_confirmation",
                label: "Deposit credited",
                referenceType: "deposit_intent",
                referenceId: "dep_1",
                description: null,
                amountMinor: "5100",
                direction: "credit",
                currency: "USD",
                walletCategory: "available",
                postedAt: "2026-06-15T15:00:00.000Z",
                href: null,
              },
            ],
            currency: "USD",
            related: {
              ledgerHref: "/ledger",
              walletHref: "/wallet",
              portfolioHref: "/portfolio",
              successHref: "/account/success",
            },
          },
        },
      });
    });

    await page.route("**/api/customer/statements/monthly-2026-06/download", async (route) => {
      await route.fulfill({
        json: { data: { recorded: true, statementId: "monthly-2026-06", downloadedAt: "2026-07-13T12:00:00.000Z" } },
      });
    });
  });

  test("list answers financial history understanding", async ({ page }) => {
    await page.goto("/account/statements");
    await expect(page.getByRole("heading", { level: 1, name: "Statements" })).toBeVisible();
    await expect(page.getByText("June 2026")).toBeVisible();
    await expect(page.getByText("Download history")).toBeVisible();
  });

  test("detail shows summary hierarchy and download", async ({ page }) => {
    await page.goto("/account/statements/monthly-2026-06");
    await expect(page.getByRole("heading", { name: "June 2026" })).toBeVisible();
    await expect(page.getByText("Period net activity", { exact: true })).toBeVisible();
    await expect(page.getByText("not tax advice", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "Download CSV" })).toBeVisible();
  });
});

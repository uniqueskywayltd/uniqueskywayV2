import { expect, test } from "@playwright/test";

test.describe("sprint G4 referral experience", () => {
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

    await page.route("**/api/customer/referrals", async (route) => {
      await route.fulfill({
        json: {
          data: {
            northStar: "How do I recommend this platform responsibly?",
            understanding:
              "Referrals are invitations to a trusted service — not pressure, spam, or an affiliate race.",
            code: {
              id: "code_1",
              code: "SKY-AVERY",
              status: "active",
              isDefault: true,
              createdAt: "2026-07-01T00:00:00.000Z",
            },
            codes: [],
            share: {
              url: "http://localhost:3000/auth/register?referral=SKY-AVERY",
              text: "Invite with SKY-AVERY. Returns are never guaranteed.",
              disclaimer: "This is an invitation, not financial advice. Returns are never guaranteed.",
            },
            guidance: [
              {
                id: "good-practices",
                title: "Good practices",
                body: "Invite people who welcome a calm recommendation.",
              },
            ],
            summary: {
              referralCount: 1,
              qualifiedCount: 1,
              pendingCount: 0,
              rewardedCount: 0,
              postedRewardCount: 1,
              pendingRewardCount: 0,
              postedRewardAmountMinor: "2500",
            },
            referrals: [
              {
                id: "ref_1",
                status: "qualified",
                statusLabel: "Qualified",
                createdAt: "2026-07-05T00:00:00.000Z",
                qualifiedAt: "2026-07-06T00:00:00.000Z",
              },
            ],
            rewards: [
              {
                id: "rw_1",
                currency: "USD",
                amountMinor: "2500",
                status: "posted",
                statusLabel: "Reward credited",
                postedAt: "2026-07-10T00:00:00.000Z",
                createdAt: "2026-07-10T00:00:00.000Z",
                ledgerHint: "Credited to your ledger — not a points balance.",
              },
            ],
            links: {
              learnHref: "/account/learn/referrals-responsible",
              helpHref: "/account/help",
              ledgerHref: "/ledger",
              successHref: "/account/success",
            },
          },
        },
      });
    });
  });

  test("referral hub answers responsible recommendation", async ({ page }) => {
    await page.goto("/account/referrals");
    await expect(page.getByRole("heading", { level: 1, name: "Referrals" })).toBeVisible();
    await expect(page.getByText("SKY-AVERY", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your invitation" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Guidance" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy code" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
  });
});

import { expect, test } from "@playwright/test";

test.describe("sprint B2 portfolio experience", () => {
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

    await page.route("**/api/customer/investments**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.match(/\/api\/customer\/investments\/[^/]+$/)) {
        await route.fulfill({
          json: {
            data: {
              investment: sampleCard(),
              schedule: [
                {
                  id: "roi_1",
                  sequenceNumber: 1,
                  earningDate: "2026-07-14",
                  settlementDate: "2026-07-15",
                  expectedRoiMicroMinor: "1000000",
                  status: "posted",
                  postedAt: "2026-07-15T12:00:00.000Z",
                },
                {
                  id: "roi_2",
                  sequenceNumber: 2,
                  earningDate: "2026-07-15",
                  settlementDate: "2026-07-16",
                  expectedRoiMicroMinor: "1000000",
                  status: "scheduled",
                  postedAt: null,
                },
              ],
              lifecycle: [
                {
                  key: "created",
                  label: "Created",
                  at: "2026-07-01T00:00:00.000Z",
                  complete: true,
                },
                {
                  key: "activated",
                  label: "Activated",
                  at: "2026-07-01T00:00:00.000Z",
                  complete: true,
                },
                {
                  key: "settling",
                  label: "Settling (New York days)",
                  at: "2026-07-02",
                  complete: true,
                },
                {
                  key: "matured",
                  label: "Matured",
                  at: "2026-08-01",
                  complete: false,
                },
              ],
            },
          },
        });
        return;
      }

      await route.fulfill({
        json: {
          data: {
            summary: {
              totalCount: 1,
              byStatus: {
                pending: 0,
                active: 1,
                maturing: 0,
                matured: 0,
                cancelled: 0,
                failed: 0,
              },
              activePrincipalMinor: "250000",
            },
            investments: [sampleCard()],
          },
        },
      });
    });
  });

  test("renders portfolio shell answering how investments perform", async ({ page }) => {
    await page.goto("/portfolio");
    await expect(page.getByRole("heading", { level: 1, name: "Investments" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Portfolio navigation" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Investment filters" })).toBeVisible();
    await expect(
      page.getByRole("tablist", { name: "Filter investments by status" }),
    ).toBeVisible();
    await expect(page.getByRole("list", { name: "Investment positions" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Growth Plan" })).toBeVisible();
    await expect(page.getByText("What happens next?")).toBeVisible();
    await expect(page.getByText("ROI credited")).toBeVisible();
    await expect(page.getByRole("term").filter({ hasText: /^Principal$/ })).toBeVisible();
    await expect(page.getByText("Matures", { exact: true })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Progress 40%" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add funds" })).toHaveCount(0);
    await expect(page.getByText("1 position shown")).toBeVisible();
    await expect(page.getByRole("region", { name: "Status distribution" })).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Status distribution" }).getByText("Active", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Portfolio navigation" }).getByRole("link", {
        name: "Explore plans",
      }),
    ).toHaveAttribute("href", "/plans");
  });

  test("supports filters and opens read-only detail", async ({ page }) => {
    await page.goto("/portfolio");
    await page.getByRole("tab", { name: "Active" }).click();
    await page.getByRole("link", { name: /Growth Plan/ }).click();
    await expect(page).toHaveURL(/\/portfolio\/inv_1$/);
    await expect(page.getByRole("heading", { level: 1, name: "Growth Plan" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Investment header" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Investment details" })).toBeVisible();
    await expect(page.getByText("ROI credited")).toBeVisible();
    await expect(page.getByText("Maturity date")).toBeVisible();
    await expect(page.getByText("What happens next?")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Lifecycle" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Settlement schedule" })).toBeVisible();
    await expect(page.getByText("Credited").first()).toBeVisible();
    await expect(page.getByRole("region", { name: "Important notices" })).toBeVisible();
    await expect(page.getByText("This page does not edit investments")).toBeVisible();
    await expect(page.getByRole("link", { name: "All investments" })).toHaveAttribute(
      "href",
      "/portfolio",
    );
  });
});

function sampleCard() {
  return {
    id: "inv_1",
    planName: "Growth Plan",
    currency: "USD",
    principalMinor: "250000",
    postedRoiMinor: "1500",
    termDays: 30,
    status: "active",
    startAt: "2026-07-01T00:00:00.000Z",
    firstSettlementDate: "2026-07-02",
    maturityDate: "2026-08-01",
    activatedAt: "2026-07-01T00:00:00.000Z",
    maturedAt: null,
    cancelledAt: null,
    createdAt: "2026-07-01T00:00:00.000Z",
    progressPercent: 40,
    nextMilestone: { label: "Maturity (New York day)", date: "2026-08-01" },
  };
}

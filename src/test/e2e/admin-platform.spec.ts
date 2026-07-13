import { expect, test } from "@playwright/test";

test.describe("admin platform console", () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminApis(page);
  });

  test("renders the admin shell and overview", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Admin navigation" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Customers/ })).toBeVisible();
    await expect(page.getByText("Pending deposits")).toBeVisible();
  });

  test("supports core admin list surfaces", async ({ page }) => {
    await page.goto("/admin/customers");
    await expect(page.getByRole("heading", { name: "Customers", exact: true })).toBeVisible();
    await expect(page.getByLabel("Search customers")).toBeVisible();
    await expect(page.getByText("investor@example.com")).toBeVisible();

    await page.goto("/admin/deposits");
    await expect(page.getByRole("heading", { name: "Deposits", exact: true })).toBeVisible();
    await expect(page.getByText("USWDEP-1")).toBeVisible();

    await page.goto("/admin/reports");
    await expect(page.getByRole("heading", { name: "Reports", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Export CSV" })).toBeVisible();
  });

  test("uses mobile admin navigation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin/system");
    await expect(page.getByRole("button", { name: "Toggle navigation" })).toBeVisible();
    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await expect(page.getByRole("navigation", { name: "Admin mobile navigation" })).toBeVisible();
    await page.getByRole("link", { name: /Security/ }).click();
    await expect(page).toHaveURL(/\/admin\/security$/);
  });
});

async function mockAdminApis(page: import("@playwright/test").Page) {
  await page.route("**/api/admin/overview", async (route) => {
    await route.fulfill({
      json: {
        data: {
          pendingDeposits: 2,
          pendingWithdrawals: 1,
          underReviewWithdrawals: 1,
          depositsToday: 3,
          withdrawalsToday: 1,
          pendingReviews: 3,
          failedJobs: 0,
          failedWebhooks: 0,
          deadLetteredWebhooks: 0,
          recentActivity: [
            {
              id: "audit_1",
              action: "deposit.note_added",
              targetType: "deposit_intent",
              createdAt: "2026-07-13T16:00:00.000Z",
            },
          ],
        },
      },
    });
  });

  await page.route("**/api/admin/users**", async (route) => {
    await route.fulfill({
      json: {
        data: {
          customers: [
            {
              userId: "user_1",
              email: "investor@example.com",
              accountStatus: "active",
              userStatus: "active",
              kycStatus: "approved",
              userCreatedAt: "2026-07-13T12:00:00.000Z",
            },
          ],
          nextCursor: null,
        },
      },
    });
  });

  await page.route("**/api/admin/deposits**", async (route) => {
    await route.fulfill({
      json: {
        data: {
          deposits: [
            {
              id: "deposit_1",
              providerIntentId: "USWDEP-1",
              status: "pending",
              amountMinor: "10000",
              createdAt: "2026-07-13T12:00:00.000Z",
            },
          ],
          nextCursor: null,
        },
      },
    });
  });

  await page.route("**/api/admin/reports/executive", async (route) => {
    await route.fulfill({
      json: {
        data: {
          dashboard: {
            customers: { total: 10, verified: 4, suspended: 1 },
            moneyMovement: {
              pendingDeposits: 2,
              pendingWithdrawals: 1,
              totalRoiPaidMinor: "5000",
            },
          },
        },
      },
    });
  });

  await page.route("**/api/admin/system/health", async (route) => {
    await route.fulfill({
      json: {
        data: {
          application: "ok",
          version: "1.0.0",
          gitCommit: "abc123",
          releaseTag: "phase-8-admin-platform",
          database: "ok",
          queues: { pendingJobs: 0, failedJobs: 0, runningJobs: 0 },
        },
      },
    });
  });

  await page.route("**/api/admin/security/center", async (route) => {
    await route.fulfill({
      json: {
        data: {
          securityEvents: [],
          adminActivity: [],
        },
      },
    });
  });
}

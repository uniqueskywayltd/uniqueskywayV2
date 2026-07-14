import { expect, test } from "@playwright/test";

test.describe("identity UI", () => {
  test("renders authentication entry pages", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(page.getByText("Secure Platform")).toBeVisible();

    await page.goto("/auth/register");
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await expect(page.getByLabel("Full name")).toBeVisible();
    await expect(page.getByLabel("Username")).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm password")).toBeVisible();
    await expect(page.getByText("Investment Package")).toBeVisible();
    await expect(page.getByRole("button", { name: /Tap to select a package|Silver Plan|Gold Plan|Classic Plan|Master Plan/ })).toBeVisible();
    await expect(page.getByLabel("Referral code")).toBeVisible();
    await expect(page.getByText("Security check")).toHaveCount(0);
    await expect(page.getByText("Enter the sum to confirm you are not a bot.")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();

    await page.goto("/auth/verify-email");
    await expect(page.getByRole("heading", { name: "Verify email" })).toBeVisible();
    await expect(page.getByLabel("Verification code")).toBeVisible();

    await page.goto("/auth/forgot-password");
    await expect(page.getByRole("heading", { name: "Forgot password?" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Send reset code" })).toBeVisible();

    await page.goto("/auth/reset-password");
    await expect(page.getByRole("heading", { name: "Set new password" })).toBeVisible();
    await expect(page.getByLabel("Reset code")).toBeVisible();
    await expect(page.locator('input[name="password"][autocomplete="new-password"]')).toBeVisible();
  });

  test("renders trusted-device and session management pages from API data", async ({ page }) => {
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
              displayName: "Avery",
              legalName: "Avery Investor",
              avatarUrl: null,
            },
            account: {
              status: "active",
            },
            unreadNotificationCount: 0,
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
                current: true,
              },
            ],
          },
        },
      });
    });

    await page.goto("/account/security/trusted-devices");
    await expect(page.getByRole("heading", { name: "Trusted devices" })).toBeVisible();
    await expect(page.getByText("Mac browser")).toBeVisible();
    await expect(page.getByRole("button", { name: "Revoke device" })).toBeVisible();

    await page.goto("/account/security/sessions");
    await expect(page.getByRole("heading", { name: "Sessions" })).toBeVisible();
    await expect(page.getByText("Current", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out current session" })).toBeVisible();
  });
});

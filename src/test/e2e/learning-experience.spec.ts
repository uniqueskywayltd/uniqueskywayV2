import { expect, test } from "@playwright/test";

test.describe("sprint G3 learning experience", () => {
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

    await page.route("**/api/customer/learn**", async (route) => {
      const url = route.request().url();
      if (url.includes("/complete")) {
        await route.fulfill({
          json: {
            data: {
              lesson: {
                slug: "welcome-after-sign-in",
                title: "What happens after I sign in?",
                question: "Where do I start?",
                summary: "Dashboard answers money today.",
                body: "After sign-in, Dashboard is your financial home.",
                estimatedMinutes: 2,
                pathId: "getting-started",
                pathTitle: "Getting Started",
                relatedSlugs: [],
                appHref: "/dashboard",
                appHrefLabel: "Open dashboard",
                videoNote: null,
                completed: true,
                status: "completed",
              },
              related: [],
              nextAfterComplete: {
                slug: "available-vs-pending",
                title: "Available vs Pending vs Locked",
                href: "/account/learn/available-vs-pending",
              },
              footer: "This is educational guidance — not investment, tax, or legal advice.",
            },
          },
        });
        return;
      }

      if (url.includes("/api/customer/learn/welcome-after-sign-in")) {
        await route.fulfill({
          json: {
            data: {
              lesson: {
                slug: "welcome-after-sign-in",
                title: "What happens after I sign in?",
                question: "Where do I start?",
                summary: "Dashboard answers money today.",
                body: "After sign-in, Dashboard is your financial home.",
                estimatedMinutes: 2,
                pathId: "getting-started",
                pathTitle: "Getting Started",
                relatedSlugs: [],
                appHref: "/dashboard",
                appHrefLabel: "Open dashboard",
                videoNote: null,
                completed: false,
                status: "recommended",
              },
              related: [],
              nextAfterComplete: null,
              footer: "This is educational guidance — not investment, tax, or legal advice.",
            },
          },
        });
        return;
      }

      await route.fulfill({
        json: {
          data: {
            understanding: "What should I learn next?",
            recommended: {
              slug: "welcome-after-sign-in",
              title: "What happens after I sign in?",
              summary: "Dashboard answers money today.",
              reason: "Start here — a calm first orientation.",
              href: "/account/learn/welcome-after-sign-in",
              estimatedMinutes: 2,
            },
            progress: { completedCount: 0, totalCount: 13, completed: [] },
            paths: [
              {
                id: "getting-started",
                title: "Getting Started",
                description: "Orient after sign-in.",
                lessonCount: 3,
                completedCount: 0,
                status: "recommended",
                href: "/account/learn?path=getting-started",
              },
            ],
            lessons: [
              {
                slug: "welcome-after-sign-in",
                title: "What happens after I sign in?",
                question: "Where do I start?",
                summary: "Dashboard answers money today.",
                estimatedMinutes: 2,
                pathId: "getting-started",
                status: "recommended",
                href: "/account/learn/welcome-after-sign-in",
              },
            ],
            emptyHint: null,
          },
        },
      });
    });
  });

  test("learn home recommends next lesson", async ({ page }) => {
    await page.goto("/account/learn");
    await expect(page.getByRole("heading", { level: 1, name: "Learning" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recommended next" })).toBeVisible();
    await expect(page.getByText("What happens after I sign in?").first()).toBeVisible();
  });

  test("lesson detail supports mark as read", async ({ page }) => {
    await page.goto("/account/learn/welcome-after-sign-in");
    await expect(page.getByRole("heading", { name: "What happens after I sign in?" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mark as read" })).toBeVisible();
  });
});

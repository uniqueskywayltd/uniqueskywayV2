import { describe, expect, it } from "vitest";

import type { CustomerSummary } from "@/features/customer/types";
import { getPersonFullName, getPersonHandle } from "@/lib/utils/person-display";

function summary(overrides: {
  legalName?: string | null;
  displayName?: string | null;
  accountNumber?: string | null;
  email?: string;
}): CustomerSummary {
  return {
    user: {
      id: "user-1",
      email: overrides.email ?? "williedt9@gmail.com",
      emailVerifiedAt: null,
      status: "active",
    },
    profile: {
      id: "profile-1",
      userId: "user-1",
      legalName: overrides.legalName ?? null,
      displayName: overrides.displayName ?? null,
      phone: null,
      country: null,
      stateRegion: null,
      dateOfBirth: null,
      avatarStoragePath: null,
      avatarContentType: null,
      avatarUpdatedAt: null,
      onboardingStatus: "not_started",
      kycStatus: "not_started",
      riskStatus: "not_reviewed",
    },
    account: overrides.accountNumber
      ? {
          id: "account-1",
          accountNumber: overrides.accountNumber,
          status: "active",
          restrictionReason: null,
          openedAt: new Date("2026-07-01T00:00:00.000Z"),
        }
      : null,
    preferences: {
      id: null,
      userId: "user-1",
      appearance: "system",
      language: "en",
      timeZone: "America/New_York",
      inAppNotificationsEnabled: true,
      securityEmailsEnabled: true,
      productEmailsEnabled: true,
      marketingEmailsEnabled: false,
    },
    notificationPreferences: {
      inApp: {},
      email: { security: true, product: true, marketing: false },
    },
    unreadNotificationCount: 0,
  };
}

describe("person-display", () => {
  it("prefers legal name over username stored in displayName", () => {
    const person = summary({
      legalName: "Willie Wendy",
      displayName: "williedt9",
      accountNumber: "USW-3049D66C1DC3",
    });
    expect(getPersonFullName(person)).toBe("Willie Wendy");
    expect(getPersonHandle(person)).toBe("williedt9");
  });

  it("never uses customer ID / account number as the username handle", () => {
    const person = summary({
      legalName: null,
      displayName: null,
      accountNumber: "USW-3049D66C1DC3",
      email: "williedt9@gmail.com",
    });
    expect(getPersonHandle(person)).toBe("williedt9");
    expect(getPersonHandle(person)).not.toContain("USW-");
  });
});

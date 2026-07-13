import { describe, expect, it } from "vitest";

import {
  classifyNotificationType,
  resolveNotificationHref,
  searchHelpArticles,
  sortPresentedNotifications,
} from "@/application/customer/communication-presentation";

describe("communication presentation", () => {
  it("classifies financial and security notification types", () => {
    expect(classifyNotificationType("deposit.confirmed")).toBe("financial");
    expect(classifyNotificationType("security.new_device")).toBe("security");
    expect(classifyNotificationType("system.maintenance")).toBe("system");
  });

  it("resolves deep links from typed data", () => {
    expect(
      resolveNotificationHref("deposit.confirmed", { depositIntentId: "dep_1" }),
    ).toBe("/wallet/deposits/dep_1");
    expect(resolveNotificationHref("security.new_device", {})).toBe("/account/security");
  });

  it("sorts unread security ahead of older financial success", () => {
    const sorted = sortPresentedNotifications([
      {
        priority: "success",
        category: "financial" as const,
        readAt: null,
        createdAt: "2026-07-13T10:00:00.000Z",
      },
      {
        priority: "critical",
        category: "security" as const,
        readAt: null,
        createdAt: "2026-07-12T10:00:00.000Z",
      },
    ]);
    expect(sorted[0]?.category).toBe("security");
  });

  it("searches help articles", () => {
    expect(searchHelpArticles("accrued").some((item) => item.id === "accrued-vs-credited")).toBe(
      true,
    );
  });
});

import { FINANCIAL_TIME_ZONE } from "@/config/constants";

export type NotificationCategory = "financial" | "security" | "system";

const FINANCIAL_TYPE_PREFIXES = [
  "deposit.",
  "withdrawal.",
  "investment.",
  "settlement.",
  "roi.",
  "referral.reward",
  "ledger.",
] as const;

const SECURITY_TYPE_PREFIXES = [
  "security.",
  "auth.",
  "session.",
  "password.",
  "device.",
  "trusted_device.",
] as const;

export function classifyNotificationType(type: string): NotificationCategory {
  const normalized = type.toLowerCase();
  if (FINANCIAL_TYPE_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return "financial";
  }
  if (SECURITY_TYPE_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return "security";
  }
  if (normalized.includes("security") || normalized.includes("password") || normalized.includes("session")) {
    return "security";
  }
  if (
    normalized.includes("deposit") ||
    normalized.includes("withdrawal") ||
    normalized.includes("investment") ||
    normalized.includes("roi")
  ) {
    return "financial";
  }
  return "system";
}

export function notificationPriorityRank(priority: string): number {
  switch (priority) {
    case "critical":
      return 0;
    case "warning":
      return 1;
    case "success":
      return 2;
    default:
      return 3;
  }
}

export function categoryPriorityRank(category: NotificationCategory): number {
  switch (category) {
    case "security":
      return 0;
    case "financial":
      return 1;
    default:
      return 2;
  }
}

export function resolveNotificationHref(
  type: string,
  data: Record<string, unknown> | null | undefined,
): string | null {
  if (data && typeof data.href === "string" && data.href.startsWith("/")) {
    return data.href;
  }
  if (data && typeof data.depositIntentId === "string") {
    return `/wallet/deposits/${data.depositIntentId}`;
  }
  if (data && typeof data.withdrawalId === "string") {
    return `/wallet/withdrawals/${data.withdrawalId}`;
  }
  if (data && typeof data.investmentId === "string") {
    return `/portfolio/${data.investmentId}`;
  }

  const category = classifyNotificationType(type);
  if (category === "security") return "/account/security";
  if (category === "financial") return "/wallet";
  return null;
}

export function isNewYorkToday(iso: string | Date, now = new Date()): boolean {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: FINANCIAL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date(iso)) === formatter.format(now);
}

export function sortPresentedNotifications<
  T extends { priority: string; category: NotificationCategory; readAt: string | Date | null; createdAt: string | Date },
>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const unreadDelta = Number(Boolean(left.readAt)) - Number(Boolean(right.readAt));
    if (unreadDelta !== 0) return unreadDelta;

    const categoryDelta =
      categoryPriorityRank(left.category) - categoryPriorityRank(right.category);
    if (categoryDelta !== 0) return categoryDelta;

    // Within financial, failures (warning/critical) before success.
    if (left.category === "financial" && right.category === "financial") {
      const priorityDelta =
        notificationPriorityRank(left.priority) - notificationPriorityRank(right.priority);
      if (priorityDelta !== 0) return priorityDelta;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

export const HELP_ARTICLES = [
  {
    id: "available-vs-pending",
    title: "Available vs Pending vs Locked",
    category: "Wallet",
    summary: "Available is spendable. Pending is not final. Locked is committed to investments.",
    body: "Your wallet is an operations center. Available equals what you can invest or withdraw. Pending usually means an in-flight deposit. Locked principal stays in investments until a certified unlock event.",
  },
  {
    id: "deposit-safe",
    title: "How deposits become Available",
    category: "Deposits",
    summary: "Deposits feel safe — not fast. Funds credit after confirmation.",
    body: "Create a deposit, complete the provider step, then wait for confirmation. Confirmed deposits post to the ledger and appear as Available. Failed or cancelled deposits do not invent balance.",
  },
  {
    id: "withdrawal-anxiety",
    title: "What happens after I withdraw",
    category: "Withdrawals",
    summary: "Status, next step, expectancy, and support — every time.",
    body: "A withdrawal reserves funds so they cannot be spent twice. Review may occur. Processing uses the certified provider. Paid means the payout completed; confirm receipt at your destination.",
  },
  {
    id: "accrued-vs-credited",
    title: "Accrued earnings vs credited earnings",
    category: "Portfolio",
    summary: "Accrued is not withdrawable. Credited means it posted.",
    body: "Scheduled ROI rows are plans, not wallet cash. Only credited postings change Available. Portfolio shows schedule truth; wallet shows operational cash.",
  },
  {
    id: "new-york-settlement",
    title: "New York settlement days",
    category: "Settlements",
    summary: "Settlement language uses America/New_York calendar days.",
    body: "Expectancy around settlement references New York business days. The UI never invents guaranteed clock times for postings.",
  },
  {
    id: "security-first",
    title: "Security alerts take priority",
    category: "Security",
    summary: "New devices and password changes surface before money success notes.",
    body: "If your account integrity is at risk, address Security before routine wallet activity. Session and trusted-device controls live under Account → Security.",
  },
] as const;

export const WHATS_NEW_ITEMS = [
  {
    id: "profile-security",
    title: "Profile & Security controls",
    summary: "Account, password, devices, and sessions in one DashboardShell experience.",
    date: "2026-07-14",
    href: "/account",
  },
  {
    id: "wave-b-wallet",
    title: "Wallet operations center",
    summary: "Available, Pending, Locked, and clear deposit/withdrawal journeys.",
    date: "2026-07-13",
    href: "/wallet",
  },
  {
    id: "wave-b-portfolio",
    title: "Read-only portfolio clarity",
    summary: "Investment cards answer where your money is — without mutation.",
    date: "2026-07-13",
    href: "/portfolio",
  },
  {
    id: "wave-b-dashboard",
    title: "Dashboard as financial home",
    summary: "One place to answer: how am I doing today?",
    date: "2026-07-13",
    href: "/dashboard",
  },
] as const;

export function searchHelpArticles(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...HELP_ARTICLES];
  return HELP_ARTICLES.filter((article) => {
    const haystack = `${article.title} ${article.summary} ${article.body} ${article.category}`.toLowerCase();
    return haystack.includes(normalized);
  });
}

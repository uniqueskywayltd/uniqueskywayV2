import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  LayoutDashboard,
  MessagesSquare,
  PieChart,
  ScrollText,
  Settings,
  Shield,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";

export type DashboardNavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  exact?: boolean;
};

/** Visual parity with platform dashboard nav; routes map to V3 architecture. */
export const dashboardNavItems: DashboardNavItem[] = [
  { href: "/dashboard", labelKey: "nav.overview", icon: LayoutDashboard, exact: true },
  { href: "/wallet/deposits", labelKey: "nav.deposits", icon: ArrowDownLeft },
  { href: "/wallet/withdrawals", labelKey: "nav.withdrawals", icon: ArrowUpRight },
  { href: "/wallet", labelKey: "nav.wallet", icon: Wallet },
  { href: "/portfolio", labelKey: "nav.investments", icon: PieChart },
  { href: "/ledger", labelKey: "nav.ledger", icon: ScrollText },
  { href: "/account/success", labelKey: "nav.success", icon: Sparkles },
  { href: "/account/notifications", labelKey: "chrome.notifications", icon: Bell },
  { href: "/account/activity", labelKey: "nav.activity", icon: Activity },
  { href: "/account/communications", labelKey: "nav.communications", icon: MessagesSquare },
  { href: "/account/profile", labelKey: "nav.profile", icon: User },
  { href: "/account/security", labelKey: "nav.security", icon: Shield },
  { href: "/account/preferences", labelKey: "nav.preferences", icon: Settings },
];

export function getDashboardNavLabelKey(pathname: string): string {
  const match = dashboardNavItems.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href),
  );
  return match?.labelKey ?? "nav.overview";
}

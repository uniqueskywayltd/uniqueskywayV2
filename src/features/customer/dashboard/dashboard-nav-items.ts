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
  User,
  Wallet,
} from "lucide-react";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

/** Visual parity with platform dashboard nav; routes map to V3 architecture. */
export const dashboardNavItems: DashboardNavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/wallet/deposits", label: "Deposits", icon: ArrowDownLeft },
  { href: "/wallet/withdrawals", label: "Withdrawals", icon: ArrowUpRight },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/portfolio", label: "Investments", icon: PieChart },
  { href: "/ledger", label: "Ledger", icon: ScrollText },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/activity", label: "Activity", icon: Activity },
  { href: "/account/communications", label: "Communications", icon: MessagesSquare },
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/security", label: "Security", icon: Shield },
  { href: "/account/preferences", label: "Preferences", icon: Settings },
];

export function getDashboardNavLabel(pathname: string): string {
  const match = dashboardNavItems.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href),
  );
  return match?.label ?? "Overview";
}

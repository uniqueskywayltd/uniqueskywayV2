import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Building2,
  ClipboardList,
  Flag,
  Landmark,
  LayoutDashboard,
  LineChart,
  Settings2,
  ShieldAlert,
  Users,
  UserCog,
  Wallet,
  Workflow,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export const ADMIN_NAVIGATION: readonly AdminNavItem[] = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Operational snapshot",
  },
  {
    label: "Customers",
    href: "/admin/customers",
    icon: Users,
    description: "Search and manage customers",
  },
  {
    label: "Deposits",
    href: "/admin/deposits",
    icon: Landmark,
    description: "Deposit review queue",
  },
  {
    label: "Withdrawals",
    href: "/admin/withdrawals",
    icon: Wallet,
    description: "Withdrawal review queue",
  },
  {
    label: "Investments",
    href: "/admin/investments",
    icon: LineChart,
    description: "Read-only investments",
  },
  {
    label: "Settlements",
    href: "/admin/settlements",
    icon: ClipboardList,
    description: "Settlement runs",
  },
  {
    label: "Staff",
    href: "/admin/staff",
    icon: UserCog,
    description: "Staff accounts",
  },
  {
    label: "Roles",
    href: "/admin/roles",
    icon: Building2,
    description: "Roles and permissions",
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: Activity,
    description: "Reporting and exports",
  },
  {
    label: "Jobs",
    href: "/admin/jobs",
    icon: Workflow,
    description: "Background jobs",
  },
  {
    label: "Security",
    href: "/admin/security",
    icon: ShieldAlert,
    description: "Security center",
  },
  {
    label: "Feature flags",
    href: "/admin/feature-flags",
    icon: Flag,
    description: "Runtime feature flags",
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings2,
    description: "System settings",
  },
  {
    label: "System",
    href: "/admin/system",
    icon: Building2,
    description: "Health and release info",
  },
] as const;

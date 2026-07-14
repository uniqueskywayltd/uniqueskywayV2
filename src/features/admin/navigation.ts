import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  ClipboardList,
  Flag,
  LayoutDashboard,
  LineChart,
  PieChart,
  Settings2,
  ShieldAlert,
  UserCog,
  Users,
  Workflow,
} from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
};

export type AdminNavSection = {
  label: string;
  items: readonly AdminNavItem[];
};

/** V2 admin routes only — sectioned for platform portal visual parity. */
export const ADMIN_NAV_SECTIONS: readonly AdminNavSection[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/deposits", label: "Deposits", icon: ArrowDownLeft },
      { href: "/admin/withdrawals", label: "Withdrawals", icon: ArrowUpRight },
      { href: "/admin/investments", label: "Investments", icon: PieChart },
      { href: "/admin/settlements", label: "Settlements", icon: ClipboardList },
      { href: "/admin/jobs", label: "Jobs", icon: Workflow },
    ],
  },
  {
    label: "Access",
    items: [
      { href: "/admin/staff", label: "Staff", icon: UserCog },
      { href: "/admin/roles", label: "Roles", icon: Building2 },
      { href: "/admin/security", label: "Security", icon: ShieldAlert },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/admin/reports", label: "Reports", icon: LineChart },
      { href: "/admin/feature-flags", label: "Feature Flags", icon: Flag },
      { href: "/admin/settings", label: "Settings", icon: Settings2 },
      { href: "/admin/system", label: "System", icon: Activity },
    ],
  },
] as const;

/** Flat list for legacy lookups (active label, etc.). */
export const ADMIN_NAVIGATION = ADMIN_NAV_SECTIONS.flatMap((section) =>
  section.items.map((item) => ({
    ...item,
    description: section.label,
  })),
);

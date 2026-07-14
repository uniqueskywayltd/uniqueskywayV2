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
  labelKey: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
};

export type AdminNavSection = {
  labelKey: string;
  items: readonly AdminNavItem[];
};

/** V2 admin routes only — sectioned for platform portal visual parity. */
export const ADMIN_NAV_SECTIONS: readonly AdminNavSection[] = [
  {
    labelKey: "admin.section.overview",
    items: [{ href: "/admin", labelKey: "admin.nav.dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    labelKey: "admin.section.operations",
    items: [
      { href: "/admin/customers", labelKey: "admin.nav.customers", icon: Users },
      { href: "/admin/deposits", labelKey: "admin.nav.deposits", icon: ArrowDownLeft },
      { href: "/admin/withdrawals", labelKey: "admin.nav.withdrawals", icon: ArrowUpRight },
      { href: "/admin/investments", labelKey: "admin.nav.investments", icon: PieChart },
      { href: "/admin/settlements", labelKey: "admin.nav.settlements", icon: ClipboardList },
      { href: "/admin/jobs", labelKey: "admin.nav.jobs", icon: Workflow },
    ],
  },
  {
    labelKey: "admin.section.access",
    items: [
      { href: "/admin/staff", labelKey: "admin.nav.staff", icon: UserCog },
      { href: "/admin/roles", labelKey: "admin.nav.roles", icon: Building2 },
      { href: "/admin/security", labelKey: "admin.nav.security", icon: ShieldAlert },
    ],
  },
  {
    labelKey: "admin.section.platform",
    items: [
      { href: "/admin/reports", labelKey: "admin.nav.reports", icon: LineChart },
      { href: "/admin/feature-flags", labelKey: "admin.nav.feature_flags", icon: Flag },
      { href: "/admin/settings", labelKey: "admin.nav.settings", icon: Settings2 },
      { href: "/admin/system", labelKey: "admin.nav.system", icon: Activity },
    ],
  },
] as const;

/** Flat list for legacy lookups (active label, etc.). */
export const ADMIN_NAVIGATION = ADMIN_NAV_SECTIONS.flatMap((section) =>
  section.items.map((item) => ({
    ...item,
    description: section.labelKey,
  })),
);

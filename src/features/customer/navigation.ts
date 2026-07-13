import {
  Activity,
  Bell,
  BriefcaseBusiness,
  LayoutDashboard,
  LifeBuoy,
  Palette,
  BookOpenText,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";

/** Primary money + account IA for Wave B (`WAVE_B_UX_SPECIFICATION.md` §3). */
export const CUSTOMER_PRIMARY_NAV = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    question: "How am I doing today?",
    group: "money" as const,
  },
  {
    label: "Portfolio",
    href: "/portfolio",
    icon: BriefcaseBusiness,
    question: "Where is my money invested?",
    group: "money" as const,
  },
  {
    label: "Wallet",
    href: "/wallet",
    icon: Wallet,
    question: "How do I safely move money?",
    group: "money" as const,
  },
  {
    label: "Ledger",
    href: "/ledger",
    icon: BookOpenText,
    question: "What exactly happened?",
    group: "money" as const,
  },
  {
    label: "Notifications",
    href: "/account/notifications",
    icon: Bell,
    question: "What do I need to know right now?",
    group: "account" as const,
  },
  {
    label: "Activity",
    href: "/account/activity",
    icon: Activity,
    question: "What have I done recently?",
    group: "account" as const,
  },
  {
    label: "Help",
    href: "/account/help",
    icon: LifeBuoy,
    question: "Where can I get guidance?",
    group: "account" as const,
  },
  {
    label: "Profile",
    href: "/account/profile",
    icon: UserRound,
    question: "Who am I on this platform?",
    group: "account" as const,
  },
  {
    label: "Security",
    href: "/account/security",
    icon: ShieldCheck,
    question: "Is my account secure?",
    group: "account" as const,
  },
  {
    label: "Preferences",
    href: "/account/preferences",
    icon: Palette,
    question: "How should the product behave for me?",
    group: "account" as const,
  },
] as const;

/** Mobile bottom nav — five items max (Wave B §18). */
export const CUSTOMER_MOBILE_BOTTOM_NAV = [
  CUSTOMER_PRIMARY_NAV[0],
  CUSTOMER_PRIMARY_NAV[1],
  CUSTOMER_PRIMARY_NAV[2],
  CUSTOMER_PRIMARY_NAV[3],
  {
    label: "More",
    href: "/account",
    icon: UserRound,
    question: "Account and settings",
    group: "account" as const,
  },
] as const;

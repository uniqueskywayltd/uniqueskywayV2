import {
  Award,
  BookOpen,
  FileText,
  Gift,
  Compass,
  type LucideIcon,
} from "lucide-react";

/** Milestone 6 G1 — Success IA entries (`DEC-0046`). Shells only; no business logic. */
export const SUCCESS_HUB_LINKS = [
  {
    href: "/account/learn",
    title: "Learning",
    description: "Understand the platform before you act — concepts, not hype.",
    icon: BookOpen,
    sprintNote: "Content deepens in Sprint G3.",
  },
  {
    href: "/account/statements",
    title: "Statements",
    description: "Official records of your financial history when you need them.",
    icon: FileText,
    sprintNote: "Ledger-backed statements available now.",
  },
  {
    href: "/account/referrals",
    title: "Referrals",
    description: "Recommend Unique Sky Way responsibly and privately.",
    icon: Gift,
    sprintNote: "Invite experience deepens in Sprint G4.",
  },
  {
    href: "/account/milestones",
    title: "Milestones",
    description: "Quiet recognition of real progress you have already made.",
    icon: Award,
    sprintNote: "Shell in G1 — no points economy.",
  },
  {
    href: "/account/help",
    title: "Help Center",
    description: "Search guidance first; request support when you are stuck.",
    icon: Compass,
    sprintNote: "Existing B4 help — linked from Success Hub.",
  },
] as const satisfies ReadonlyArray<{
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  sprintNote: string;
}>;

/** Static progress pillars — educational framework only (no live scoring). */
export const SUCCESS_PROGRESS_PILLARS = [
  {
    id: "orient",
    title: "Know where your money is",
    description: "Dashboard, portfolio, and wallet answer this every visit.",
    href: "/dashboard",
    hrefLabel: "Open dashboard",
  },
  {
    id: "understand",
    title: "Understand how money works here",
    description: "Accrued ≠ credited ≠ available. Learn before you decide.",
    href: "/account/learn",
    hrefLabel: "Open learning",
  },
  {
    id: "records",
    title: "Keep clear records",
    description: "Statements will reflect certified ledger totals — never invented figures.",
    href: "/account/statements",
    hrefLabel: "Statements entry",
  },
  {
    id: "share",
    title: "Share accurately when ready",
    description: "Referrals stay privacy-first. No pressure, no gamification.",
    href: "/account/referrals",
    hrefLabel: "Referrals",
  },
  {
    id: "milestones",
    title: "Acknowledge real milestones",
    description: "Recognition for facts that already happened — never fake streaks.",
    href: "/account/milestones",
    hrefLabel: "Milestones",
  },
] as const;

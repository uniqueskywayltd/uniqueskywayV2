import Link from "next/link";
import { ArrowRight, Crown, Gem, TrendingUp, type LucideIcon } from "lucide-react";

import {
  formatPlanMoney,
  type CertifiedPublicPlan,
} from "@/features/public/content/certified-plans";
import {
  marketingOutlineBtn,
  marketingPrimaryBtn,
} from "@/features/public/components/marketing-ui";
import { cn } from "@/lib/utils";

type TierStyle = {
  icon: LucideIcon;
  accent: string;
  badge: string;
  roi: string;
  panel: string;
  level: number;
};

const TIER_STYLE: Record<CertifiedPublicPlan["slug"], TierStyle> = {
  silver: {
    icon: Gem,
    accent: "bg-slate-500",
    badge:
      "border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
    roi: "text-slate-900 dark:text-slate-100",
    panel: "border-border/70 bg-muted/40 dark:bg-muted/25",
    level: 1,
  },
  gold: {
    icon: Gem,
    accent: "bg-amber-500",
    badge:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
    roi: "text-amber-700 dark:text-amber-400",
    panel: "border-amber-200/70 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20",
    level: 2,
  },
  classic: {
    icon: TrendingUp,
    accent: "bg-sky-500",
    badge:
      "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
    roi: "text-sky-700 dark:text-sky-400",
    panel: "border-sky-200/70 bg-sky-50/40 dark:border-sky-900/40 dark:bg-sky-950/20",
    level: 3,
  },
  master: {
    icon: Crown,
    accent: "bg-violet-500",
    badge:
      "border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-200",
    roi: "text-violet-700 dark:text-violet-400",
    panel: "border-violet-200/70 bg-violet-50/40 dark:border-violet-900/40 dark:bg-violet-950/20",
    level: 4,
  },
};

/** Shared certified plan card — homepage and /plans only. Presentation only. */
export function CertifiedPlanCard({ plan }: { plan: CertifiedPublicPlan }) {
  const tierLabel = plan.name.replace(/ Plan$/i, "");
  const featured = Boolean(plan.featured);
  const style = TIER_STYLE[plan.slug];
  const TierIcon = style.icon;

  return (
    <article
      className={cn(
        "group flex flex-col border border-border/70 bg-card text-card-foreground shadow-sm transition-shadow duration-300 hover:shadow-md",
        featured &&
          "border-amber-300 ring-2 ring-amber-400/35 dark:border-amber-700 dark:ring-amber-500/25",
      )}
    >
      {featured ? (
        <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-[11px] font-semibold tracking-[0.12em] text-amber-900 uppercase dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Recommended
        </p>
      ) : null}

      <div className={cn("h-1 w-full", style.accent)} aria-hidden />

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase",
                style.badge,
              )}
            >
              <TierIcon className="h-3 w-3" aria-hidden />
              {tierLabel}
            </span>
            <h3 className="mt-3 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {plan.name}
            </h3>
            <div className="mt-2.5 flex gap-1" aria-hidden>
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  className={cn(
                    "h-1 flex-1 rounded-full",
                    n <= style.level ? style.accent : "bg-slate-200 dark:bg-slate-700",
                  )}
                />
              ))}
            </div>
          </div>
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50",
              featured && "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40",
            )}
          >
            <TierIcon
              className={cn(
                "h-4 w-4",
                featured ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
              )}
              aria-hidden
            />
          </div>
        </div>

        <div className={cn("mt-6 rounded-lg border p-5", style.panel)}>
          <div className="flex items-end gap-1">
            <span
              className={cn(
                "text-4xl leading-none font-semibold tracking-tight tabular-nums",
                style.roi,
              )}
            >
              {plan.dailyRoiPercent}
            </span>
            <span className="mb-0.5 text-sm font-medium text-muted-foreground">% daily</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{plan.durationDays}-day term</p>
        </div>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Minimum</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {formatPlanMoney(plan.minDeposit)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Maximum</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {plan.maxDeposit ? formatPlanMoney(plan.maxDeposit) : "Unlimited"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Referral</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {plan.referralCommissionPercent}%
            </dd>
          </div>
        </dl>

        <Link
          href={`/auth/register?intent=${plan.slug}`}
          className={cn(
            featured ? marketingPrimaryBtn("mt-8 w-full") : marketingOutlineBtn("mt-8 w-full"),
            "justify-center transition-transform duration-200 group-hover:translate-y-px",
          )}
        >
          Open {tierLabel}
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

/** Compact catalog line used by the registration selector (not a second card system). */
export function formatPlanSelectorMeta(plan: CertifiedPublicPlan): string {
  const max = plan.maxDeposit ? formatPlanMoney(plan.maxDeposit) : "Unlimited";
  return `${plan.dailyRoiPercent}% daily · ${plan.durationDays} days · ${formatPlanMoney(plan.minDeposit)}–${max}`;
}

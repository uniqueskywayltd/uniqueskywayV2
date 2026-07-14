import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Check,
  Crown,
  Gem,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import {
  CERTIFIED_PUBLIC_PLANS,
  formatPlanMoney,
  planTermYieldPercent,
  type CertifiedPublicPlan,
} from "@/features/public/content/certified-plans";
import {
  card,
  marketingOutlineBtn,
  marketingPrimaryBtn,
  section,
} from "@/features/public/components/marketing-ui";
import { cn } from "@/lib/utils";

const TIER_STYLE = {
  silver: {
    icon: Gem,
    accent: "bg-slate-500",
    badge:
      "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
    roi: "text-slate-900 dark:text-slate-100",
    dot: "bg-slate-500",
    level: 1,
  },
  gold: {
    icon: Gem,
    accent: "bg-amber-500",
    badge:
      "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800",
    roi: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
    level: 2,
  },
  classic: {
    icon: TrendingUp,
    accent: "bg-sky-500",
    badge:
      "bg-sky-50 text-sky-900 border-sky-200 dark:bg-sky-950/50 dark:text-sky-200 dark:border-sky-800",
    roi: "text-sky-700 dark:text-sky-400",
    dot: "bg-sky-500",
    level: 3,
  },
  master: {
    icon: Crown,
    accent: "bg-violet-500",
    badge:
      "bg-violet-50 text-violet-900 border-violet-200 dark:bg-violet-950/50 dark:text-violet-200 dark:border-violet-800",
    roi: "text-violet-700 dark:text-violet-400",
    dot: "bg-violet-500",
    level: 4,
  },
} as const;

const PERKS = ["Daily ROI crediting", "Full ledger visibility", "Dashboard access"] as const;

function PlanCard({ plan }: { plan: CertifiedPublicPlan }) {
  const style = TIER_STYLE[plan.slug];
  const TierIcon = style.icon;
  const tierLabel = plan.name.replace(/ Plan$/i, "");
  const yieldTotal = planTermYieldPercent(plan.dailyRoiPercent, plan.durationDays);
  const featured = Boolean(plan.featured);

  return (
    <article className="flex flex-col">
      <div
        className={cn(
          card.base,
          "relative flex flex-1 flex-col bg-white text-slate-900 shadow-md dark:bg-slate-900 dark:text-slate-50 dark:shadow-none",
          featured &&
            "border-amber-300 ring-2 ring-amber-400/35 dark:border-amber-700 dark:ring-amber-500/25",
        )}
      >
        {featured ? (
          <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-[11px] font-semibold tracking-[0.12em] text-amber-900 uppercase dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Recommended
          </p>
        ) : null}

        <div className={cn("h-1 w-full", style.accent)} />

        <div className={cn(card.padding, "flex flex-1 flex-col", featured && "pt-6")}>
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
              <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                {plan.name}
              </h3>
              <div className="mt-2.5 flex gap-1" aria-hidden>
                {[1, 2, 3, 4].map((n) => (
                  <span
                    key={n}
                    className={cn(
                      "h-1 flex-1 rounded-full",
                      n <= style.level ? style.dot : "bg-slate-200 dark:bg-slate-700",
                    )}
                  />
                ))}
              </div>
            </div>
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800",
                featured && "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40",
              )}
            >
              <TierIcon
                className={cn(
                  "h-4 w-4",
                  featured ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400",
                )}
                aria-hidden
              />
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60">
            <div className="flex items-end gap-0.5">
              <span
                className={cn(
                  "text-4xl leading-none font-semibold tracking-tight tabular-nums sm:text-5xl",
                  style.roi,
                )}
              >
                {plan.dailyRoiPercent}
              </span>
              <span className="mb-1 text-lg font-medium text-slate-500 dark:text-slate-400">%</span>
            </div>
            <p className="mt-1 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase dark:text-slate-400">
              Daily return
            </p>
            {yieldTotal ? (
              <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                Up to{" "}
                <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {yieldTotal}%
                </span>{" "}
                over {plan.durationDays} days
              </p>
            ) : null}
          </div>

          <ul className="mt-5 flex-1 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">
            {[
              { icon: Wallet, label: "Minimum", value: formatPlanMoney(plan.minDeposit) },
              {
                icon: TrendingUp,
                label: "Maximum",
                value: plan.maxDeposit ? formatPlanMoney(plan.maxDeposit) : "Unlimited",
              },
              { icon: Calendar, label: "Duration", value: `${plan.durationDays} days` },
              {
                icon: Users,
                label: "Referral bonus",
                value: `${plan.referralCommissionPercent}%`,
                highlight: true,
              },
            ].map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <row.icon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                  {row.label}
                </span>
                <span
                  className={cn(
                    "font-semibold tabular-nums text-slate-900 dark:text-white",
                    row.highlight && "text-emerald-700 dark:text-emerald-400",
                  )}
                >
                  {row.value}
                </span>
              </li>
            ))}
          </ul>

          <ul className="mt-4 space-y-2">
            {PERKS.map((perk) => (
              <li
                key={perk}
                className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"
              >
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                {perk}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              href={`/auth/register?intent=${plan.slug}`}
              className={cn(marketingPrimaryBtn("w-full"), "justify-center")}
            >
              Get started
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/plans"
              className={cn(marketingOutlineBtn("w-full"), "justify-center border-slate-300 dark:border-slate-600")}
            >
              View details
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

type InvestmentPlansSectionProps = {
  plans?: readonly CertifiedPublicPlan[];
  compareHref?: string;
};

export function InvestmentPlansSection({
  plans = CERTIFIED_PUBLIC_PLANS,
  compareHref = "/plans",
}: InvestmentPlansSectionProps) {
  return (
    <section
      className="relative overflow-hidden border-y border-slate-200 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
      aria-label="Investment plans"
    >
      <div className={cn(section.container, section.padding)}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold tracking-[0.14em] text-sky-700 uppercase dark:text-sky-400">
            Investment plans
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Flexible plans for every portfolio
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-700 dark:text-slate-300">
            Choose a tier that matches your goals — transparent terms, daily reporting, and full
            control from one secure investor dashboard.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-14 xl:grid-cols-4 xl:gap-6">
          {plans.map((plan) => (
            <PlanCard key={plan.slug} plan={plan} />
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-900/5 sm:mt-14 sm:p-7 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
          <div className="flex flex-col items-center justify-between gap-5 sm:flex-row sm:gap-8">
            <div className="text-center sm:text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">All plans include</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Referral rewards · Immutable ledger · 24/7 dashboard · Professional support
              </p>
            </div>
            <Link
              href={compareHref}
              className={cn(
                marketingOutlineBtn("shrink-0"),
                "border-slate-300 text-slate-900 dark:border-slate-600 dark:text-white",
              )}
            >
              Compare full details
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-slate-500 dark:text-slate-400">
          Investments involve risk, including possible loss of capital. Returns are not guaranteed.{" "}
          <Link href="/legal/risk" className="underline underline-offset-2">
            Risk Disclosure
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

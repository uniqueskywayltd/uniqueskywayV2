import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  formatPlanMoney,
  type CertifiedPublicPlan,
} from "@/features/public/content/certified-plans";
import {
  marketingOutlineBtn,
  marketingPrimaryBtn,
} from "@/features/public/components/marketing-ui";
import { cn } from "@/lib/utils";

/** Shared certified plan card — homepage and /plans only. */
export function CertifiedPlanCard({ plan }: { plan: CertifiedPublicPlan }) {
  const tierLabel = plan.name.replace(/ Plan$/i, "");
  const featured = Boolean(plan.featured);

  return (
    <article
      className={cn(
        "flex flex-col border border-border/70 bg-background",
        featured && "border-foreground/20 ring-1 ring-foreground/10",
      )}
    >
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              {tierLabel}
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{plan.name}</h3>
          </div>
          {featured ? (
            <span className="rounded-sm border border-border px-2 py-0.5 text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
              Featured
            </span>
          ) : null}
        </div>

        <div className="mt-8 border-y border-border/70 py-6">
          <div className="flex items-end gap-1">
            <span className="text-4xl leading-none font-semibold tracking-tight tabular-nums text-foreground">
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
            "justify-center",
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

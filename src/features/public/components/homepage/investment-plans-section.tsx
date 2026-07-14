import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CertifiedPlanCard } from "@/features/public/components/certified-plan-card";
import {
  CERTIFIED_PUBLIC_PLANS,
  type CertifiedPublicPlan,
} from "@/features/public/content/certified-plans";
import { marketingOutlineBtn, section } from "@/features/public/components/marketing-ui";
import { cn } from "@/lib/utils";

type InvestmentPlansSectionProps = {
  plans?: readonly CertifiedPublicPlan[];
  compareHref?: string;
  showCompareStrip?: boolean;
};

export function InvestmentPlansSection({
  plans = CERTIFIED_PUBLIC_PLANS,
  compareHref = "/plans",
  showCompareStrip = true,
}: InvestmentPlansSectionProps) {
  return (
    <section
      className="relative overflow-hidden border-y border-border/60 bg-background"
      aria-label="Investment plans"
    >
      <div className={cn(section.container, section.padding)}>
        <div className="mx-auto max-w-2xl text-center">
          <p className={section.eyebrow}>Investment plans</p>
          <h2 className={section.heading}>Structured terms. Clear ranges.</h2>
          <p className={cn(section.body, "mx-auto text-center")}>
            Certified catalog figures only — duration, deposit bands, and published daily return
            rates. No invented projections.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden border border-border/70 bg-border/70 sm:mt-14 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <CertifiedPlanCard key={plan.slug} plan={plan} />
          ))}
        </div>

        {showCompareStrip ? (
          <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center justify-between gap-4 border border-border/70 px-6 py-5 sm:mt-12 sm:flex-row sm:px-7">
            <p className="text-center text-sm text-muted-foreground sm:text-left">
              Ledger visibility, referral rewards, and dashboard access on every plan.
            </p>
            <Link href={compareHref} className={cn(marketingOutlineBtn("shrink-0"), "justify-center")}>
              Full details
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

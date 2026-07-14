/**
 * Certified public plan catalog (presentation).
 * Terms match platform migration `0011_investment_engine_m7.sql` —
 * the product authority catalog. Display only; no browser ROI math.
 */

export type CertifiedPublicPlan = {
  slug: "silver" | "gold" | "classic" | "master";
  name: string;
  description: string;
  dailyRoiPercent: string;
  minDeposit: string;
  maxDeposit: string | null;
  durationDays: number;
  referralCommissionPercent: string;
  featured?: boolean;
};

export const CERTIFIED_PUBLIC_PLANS: readonly CertifiedPublicPlan[] = [
  {
    slug: "silver",
    name: "Silver Plan",
    description: "Entry-level plan with a 5-day duration and 3% daily return.",
    dailyRoiPercent: "3",
    minDeposit: "50",
    maxDeposit: "25000",
    durationDays: 5,
    referralCommissionPercent: "10",
  },
  {
    slug: "gold",
    name: "Gold Plan",
    description: "Mid-tier plan with a 7-day duration and 5.5% daily return.",
    dailyRoiPercent: "5.5",
    minDeposit: "25000",
    maxDeposit: "50000",
    durationDays: 7,
    referralCommissionPercent: "10",
    featured: true,
  },
  {
    slug: "classic",
    name: "Classic Plan",
    description: "Premium plan with a 14-day duration and 6% daily return.",
    dailyRoiPercent: "6",
    minDeposit: "50000",
    maxDeposit: "100000",
    durationDays: 14,
    referralCommissionPercent: "10",
  },
  {
    slug: "master",
    name: "Master Plan",
    description: "Elite plan with a 30-day duration and 10% daily return.",
    dailyRoiPercent: "10",
    minDeposit: "100000",
    maxDeposit: null,
    durationDays: 30,
    referralCommissionPercent: "10",
  },
] as const;

export function formatPlanMoney(amount: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function planTermYieldPercent(dailyRoiPercent: string, durationDays: number): string | null {
  const rate = Number.parseFloat(dailyRoiPercent);
  if (!Number.isFinite(rate)) return null;
  return (rate * durationDays).toFixed(1).replace(/\.0$/, "");
}

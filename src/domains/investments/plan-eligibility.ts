/**
 * Amount-band plan eligibility for automatic investment assignment.
 * Presentation/assignment only — does not change ROI math.
 */

export type CertifiedPlanSlug = "silver" | "gold" | "classic" | "master";

export type PlanEligibilityBand = {
  slug: CertifiedPlanSlug;
  /** Inclusive minimum principal in minor units. */
  minPrincipalMinor: bigint;
  /** Inclusive maximum principal in minor units; null = unlimited. */
  maxPrincipalMinor: bigint | null;
  dailyRoiBps: number;
  termDays: number;
};

/** Platform tenure bands (USD cents). Matches production business policy. */
export const CERTIFIED_PLAN_ELIGIBILITY_BANDS: readonly PlanEligibilityBand[] = [
  {
    slug: "silver",
    minPrincipalMinor: 5_000n,
    maxPrincipalMinor: 2_499_999n,
    dailyRoiBps: 300,
    termDays: 5,
  },
  {
    slug: "gold",
    minPrincipalMinor: 2_500_000n,
    maxPrincipalMinor: 4_999_999n,
    dailyRoiBps: 550,
    termDays: 7,
  },
  {
    slug: "classic",
    minPrincipalMinor: 5_000_000n,
    maxPrincipalMinor: 9_999_999n,
    dailyRoiBps: 600,
    termDays: 14,
  },
  {
    slug: "master",
    minPrincipalMinor: 10_000_000n,
    maxPrincipalMinor: null,
    dailyRoiBps: 1_000,
    termDays: 30,
  },
] as const;

export const MINIMUM_INVESTMENT_PRINCIPAL_MINOR = 5_000n;

export function resolvePlanSlugForPrincipalMinor(principalMinor: bigint): CertifiedPlanSlug | null {
  if (principalMinor < MINIMUM_INVESTMENT_PRINCIPAL_MINOR) {
    return null;
  }

  for (const band of CERTIFIED_PLAN_ELIGIBILITY_BANDS) {
    if (principalMinor < band.minPrincipalMinor) continue;
    if (band.maxPrincipalMinor !== null && principalMinor > band.maxPrincipalMinor) continue;
    return band.slug;
  }

  return null;
}

export function resolvePlanBandForPrincipalMinor(
  principalMinor: bigint,
): PlanEligibilityBand | null {
  const slug = resolvePlanSlugForPrincipalMinor(principalMinor);
  if (!slug) return null;
  return CERTIFIED_PLAN_ELIGIBILITY_BANDS.find((band) => band.slug === slug) ?? null;
}

export function planDisplayName(slug: CertifiedPlanSlug): string {
  switch (slug) {
    case "silver":
      return "Silver Plan";
    case "gold":
      return "Gold Plan";
    case "classic":
      return "Classic Plan";
    case "master":
      return "Master Plan";
  }
}

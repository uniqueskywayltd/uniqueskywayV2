import type {
  BasisPoints,
  CurrencyCode,
  EntityId,
  IsoDateTimeString,
  MinorUnitAmount,
} from "@/domains/shared";
import type { UserId } from "@/domains/identity";

export type InvestmentPlanId = EntityId<"InvestmentPlan">;
export type InvestmentPlanVersionId = EntityId<"InvestmentPlanVersion">;

export type InvestmentPlanStatus = "draft" | "active" | "retired";
export type PrincipalReturnPolicy = "return_at_maturity" | "reinvest_at_maturity" | "manual_review";
export type EarlyExitPolicy = "not_allowed" | "admin_review" | "allowed_with_penalty";

export interface InvestmentPlan {
  id: InvestmentPlanId;
  slug: string;
  name: string;
  description: string | null;
  status: InvestmentPlanStatus;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface InvestmentPlanVersion {
  id: InvestmentPlanVersionId;
  planId: InvestmentPlanId;
  version: number;
  currency: CurrencyCode;
  minPrincipalMinor: MinorUnitAmount;
  maxPrincipalMinor: MinorUnitAmount;
  termDays: number;
  dailyRoiBps: BasisPoints;
  totalRoiBps: BasisPoints | null;
  principalReturnPolicy: PrincipalReturnPolicy;
  earlyExitPolicy: EarlyExitPolicy;
  referralRewardPolicyId: string | null;
  effectiveFrom: IsoDateTimeString;
  effectiveTo: IsoDateTimeString | null;
  status: InvestmentPlanStatus;
  createdBy: UserId | null;
  createdAt: IsoDateTimeString;
}

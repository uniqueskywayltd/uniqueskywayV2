import type {
  BasisPoints,
  CurrencyCode,
  EntityId,
  IsoDateTimeString,
  MicroMinorUnitAmount,
  MinorUnitAmount,
  NewYorkDateString,
} from "@/domains/shared";
import type { UserId } from "@/domains/identity";
import type { InvestmentPlanVersionId } from "@/domains/investment-plans";
import type { PrincipalReturnPolicy } from "@/domains/investment-plans";
import type { LedgerTransactionId } from "@/domains/ledger";

export type InvestmentId = EntityId<"Investment">;
export type RoiScheduleItemId = EntityId<"RoiScheduleItem">;

export type InvestmentStatus =
  "pending" | "active" | "maturing" | "matured" | "cancelled" | "failed";
export type RoiScheduleStatus = "scheduled" | "posted" | "skipped" | "failed";

export interface Investment {
  id: InvestmentId;
  userId: UserId;
  planVersionId: InvestmentPlanVersionId;
  currency: CurrencyCode;
  principalMinor: MinorUnitAmount;
  dailyRoiBps: BasisPoints;
  totalRoiBps: BasisPoints | null;
  promisedRoiMinor: MinorUnitAmount | null;
  termDays: number;
  principalReturnPolicy: PrincipalReturnPolicy;
  calculationVersion: string;
  idempotencyKey: string | null;
  startAt: IsoDateTimeString | null;
  firstSettlementDate: NewYorkDateString | null;
  maturityDate: NewYorkDateString | null;
  status: InvestmentStatus;
  roundingResidualMicroMinor: MicroMinorUnitAmount;
  createdAt: IsoDateTimeString;
  activatedAt: IsoDateTimeString | null;
  maturedAt: IsoDateTimeString | null;
  cancelledAt: IsoDateTimeString | null;
  fundingLedgerTransactionId: LedgerTransactionId | null;
  maturityLedgerTransactionId: LedgerTransactionId | null;
}

export interface RoiScheduleItem {
  id: RoiScheduleItemId;
  investmentId: InvestmentId;
  sequenceNumber: number;
  earningDate: NewYorkDateString;
  settlementDate: NewYorkDateString;
  expectedRoiMicroMinor: MicroMinorUnitAmount;
  status: RoiScheduleStatus;
  createdAt: IsoDateTimeString;
  postedAt: IsoDateTimeString | null;
}

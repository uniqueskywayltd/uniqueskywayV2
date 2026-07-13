import type {
  BasisPoints,
  EntityId,
  IsoDateTimeString,
  MicroMinorUnitAmount,
  MinorUnitAmount,
  NewYorkDateString,
} from "@/domains/shared";
import type { InvestmentId } from "@/domains/investments";
import type { LedgerTransactionId } from "@/domains/ledger";

export type SettlementRunId = EntityId<"SettlementRun">;
export type SettlementItemId = EntityId<"SettlementItem">;
export type RoiLedgerEntryId = EntityId<"RoiLedgerEntry">;

export type SettlementRunType = "daily" | "catch_up" | "manual_replay";
export type SettlementRunStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
export type SettlementItemStatus = "posted" | "skipped" | "failed";
export type RoiLedgerStatus = "posted" | "reversed";

export interface SettlementRun {
  id: SettlementRunId;
  settlementDate: NewYorkDateString;
  runType: SettlementRunType;
  status: SettlementRunStatus;
  startedAt: IsoDateTimeString | null;
  completedAt: IsoDateTimeString | null;
  lockedBy: string | null;
  errorMessage: string | null;
  createdAt: IsoDateTimeString;
}

export interface SettlementItem {
  id: SettlementItemId;
  settlementRunId: SettlementRunId;
  investmentId: InvestmentId;
  settlementDate: NewYorkDateString;
  grossRoiMicroMinor: MicroMinorUnitAmount;
  postedRoiMinor: MinorUnitAmount;
  roundingResidualMicroMinor: MicroMinorUnitAmount;
  ledgerTransactionId: LedgerTransactionId | null;
  status: SettlementItemStatus;
  reason: string | null;
  createdAt: IsoDateTimeString;
}

export interface RoiLedgerEntry {
  id: RoiLedgerEntryId;
  investmentId: InvestmentId;
  settlementItemId: SettlementItemId;
  earningDate: NewYorkDateString;
  settlementDate: NewYorkDateString;
  principalMinor: MinorUnitAmount;
  dailyRoiBps: BasisPoints;
  grossRoiMicroMinor: MicroMinorUnitAmount;
  previousResidualMicroMinor: MicroMinorUnitAmount;
  postedRoiMinor: MinorUnitAmount;
  nextResidualMicroMinor: MicroMinorUnitAmount;
  ledgerTransactionId: LedgerTransactionId;
  calculationVersion: string;
  status: RoiLedgerStatus;
  createdAt: IsoDateTimeString;
}

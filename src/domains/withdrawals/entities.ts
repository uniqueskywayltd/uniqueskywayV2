import type { CurrencyCode, EntityId, IsoDateTimeString, MinorUnitAmount } from "@/domains/shared";
import type { UserId } from "@/domains/identity";

export type WithdrawalRequestId = EntityId<"WithdrawalRequest">;

export type WithdrawalStatus =
  | "requested"
  | "reserved"
  | "under_review"
  | "approved"
  | "processing"
  | "paid"
  | "rejected"
  | "failed"
  | "cancelled";

export interface WithdrawalRequest {
  id: WithdrawalRequestId;
  userId: UserId;
  currency: CurrencyCode;
  amountMinor: MinorUnitAmount;
  destinationType: string;
  destinationReference: string;
  status: WithdrawalStatus;
  riskScore: number | null;
  reviewedBy: UserId | null;
  reviewedAt: IsoDateTimeString | null;
  reviewReason: string | null;
  idempotencyKey: string;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

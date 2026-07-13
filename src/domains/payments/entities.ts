import type { CurrencyCode, EntityId, IsoDateTimeString, MinorUnitAmount } from "@/domains/shared";
import type { UserId } from "@/domains/identity";

export type DepositIntentId = EntityId<"DepositIntent">;
export type WithdrawalRequestId = EntityId<"WithdrawalRequest">;
export type PaymentProviderEventId = EntityId<"PaymentProviderEvent">;

export type DepositStatus =
  "created" | "pending" | "confirmed" | "failed" | "cancelled" | "reversed";
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
export type PaymentProviderEventStatus =
  "received" | "processing" | "processed" | "failed" | "ignored";

export interface DepositIntent {
  id: DepositIntentId;
  userId: UserId;
  provider: string;
  providerIntentId: string;
  currency: CurrencyCode;
  amountMinor: MinorUnitAmount;
  status: DepositStatus;
  idempotencyKey: string;
  providerAuthorizationUrl: string | null;
  providerAccessCode: string | null;
  providerMetadata: Record<string, unknown>;
  failureReason: string | null;
  confirmationLedgerTransactionId: string | null;
  reversalLedgerTransactionId: string | null;
  createdAt: IsoDateTimeString;
  confirmedAt: IsoDateTimeString | null;
  updatedAt: IsoDateTimeString;
}

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
  provider: string | null;
  providerPayoutReference: string | null;
  providerMetadata: Record<string, unknown>;
  failureReason: string | null;
  reservationLedgerTransactionId: string | null;
  paymentLedgerTransactionId: string | null;
  releaseLedgerTransactionId: string | null;
  payoutInitiatedAt: IsoDateTimeString | null;
  paidAt: IsoDateTimeString | null;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface PaymentProviderEvent {
  id: PaymentProviderEventId;
  provider: string;
  providerEventId: string;
  eventType: string;
  payloadHash: string;
  payload: Record<string, unknown>;
  status: PaymentProviderEventStatus;
  attemptCount: number;
  nextRetryAt: IsoDateTimeString | null;
  deadLetteredAt: IsoDateTimeString | null;
  receivedAt: IsoDateTimeString;
  processedAt: IsoDateTimeString | null;
  errorMessage: string | null;
}

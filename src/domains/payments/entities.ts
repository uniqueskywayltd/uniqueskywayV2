import type { CurrencyCode, EntityId, IsoDateTimeString, MinorUnitAmount } from "@/domains/shared";
import type { UserId } from "@/domains/identity";

export type DepositIntentId = EntityId<"DepositIntent">;
export type PaymentProviderEventId = EntityId<"PaymentProviderEvent">;

export type DepositStatus =
  "created" | "pending" | "confirmed" | "failed" | "cancelled" | "reversed";
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
  createdAt: IsoDateTimeString;
  confirmedAt: IsoDateTimeString | null;
}

export interface PaymentProviderEvent {
  id: PaymentProviderEventId;
  provider: string;
  providerEventId: string;
  eventType: string;
  payloadHash: string;
  status: PaymentProviderEventStatus;
  receivedAt: IsoDateTimeString;
  processedAt: IsoDateTimeString | null;
  errorMessage: string | null;
}

import type { CurrencyCode, EntityId, IsoDateTimeString, MinorUnitAmount } from "@/domains/shared";
import type { UserId } from "@/domains/identity";
import type { InvestmentId } from "@/domains/investments";
import type { LedgerTransactionId } from "@/domains/ledger";

export type ReferralCodeId = EntityId<"ReferralCode">;
export type ReferralId = EntityId<"Referral">;
export type ReferralRewardId = EntityId<"ReferralReward">;

export type ReferralCodeStatus = "active" | "paused" | "retired";
export type ReferralStatus = "pending" | "qualified" | "rewarded" | "voided";
export type ReferralRewardStatus = "pending" | "posted" | "voided";

export interface ReferralCode {
  id: ReferralCodeId;
  userId: UserId;
  code: string;
  status: ReferralCodeStatus;
  isDefault: boolean;
  createdAt: IsoDateTimeString;
}

export interface Referral {
  id: ReferralId;
  referrerUserId: UserId;
  referredUserId: UserId;
  referralCodeId: ReferralCodeId;
  status: ReferralStatus;
  createdAt: IsoDateTimeString;
  qualifiedAt: IsoDateTimeString | null;
}

export interface ReferralReward {
  id: ReferralRewardId;
  referralId: ReferralId;
  investmentId: InvestmentId;
  currency: CurrencyCode;
  amountMinor: MinorUnitAmount;
  status: ReferralRewardStatus;
  ledgerTransactionId: LedgerTransactionId | null;
  createdAt: IsoDateTimeString;
  postedAt: IsoDateTimeString | null;
}

import type { CurrencyCode, EntityId, IsoDateTimeString, MinorUnitAmount } from "@/domains/shared";
import type { UserId } from "@/domains/identity";

export type WalletId = EntityId<"Wallet">;
export type LedgerAccountId = EntityId<"LedgerAccount">;
export type LedgerTransactionId = EntityId<"LedgerTransaction">;
export type LedgerEntryId = EntityId<"LedgerEntry">;
export type AccountBalanceSnapshotId = EntityId<"AccountBalanceSnapshot">;

export type LedgerOwnerType = "user" | "platform" | "provider";
export type LedgerDirection = "debit" | "credit";
export type WalletAccountCategory = "pending" | "available" | "locked" | "reserved" | "withdrawn";
export type LedgerAccountStatus = "active" | "closed";
export type WalletStatus = "active" | "restricted" | "closed";

export type LedgerAccountType =
  | "customer_pending_cash"
  | "customer_available_cash"
  | "customer_locked_principal"
  | "customer_reserved_withdrawal"
  | "customer_withdrawn_cash"
  | "platform_cash"
  | "platform_roi_expense"
  | "platform_referral_expense"
  | "platform_rounding"
  | "provider_cash_clearing";

export type LedgerTransactionType =
  | "deposit_confirmation"
  | "deposit_reversal"
  | "investment_funding"
  | "roi_settlement"
  | "maturity_principal_release"
  | "withdrawal_reservation"
  | "withdrawal_payment"
  | "withdrawal_release"
  | "referral_reward"
  | "ledger_correction";

export interface Wallet {
  id: WalletId;
  userId: UserId;
  currency: CurrencyCode;
  status: WalletStatus;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface LedgerAccount {
  id: LedgerAccountId;
  ownerType: LedgerOwnerType;
  ownerId: string;
  accountType: LedgerAccountType;
  currency: CurrencyCode;
  status: LedgerAccountStatus;
  createdAt: IsoDateTimeString;
}

export interface LedgerTransaction {
  id: LedgerTransactionId;
  transactionType: LedgerTransactionType;
  idempotencyKey: string | null;
  referenceType: string;
  referenceId: string;
  description: string | null;
  postedAt: IsoDateTimeString;
  createdBy: UserId | null;
  createdAt: IsoDateTimeString;
}

export interface LedgerEntry {
  id: LedgerEntryId;
  ledgerTransactionId: LedgerTransactionId;
  accountId: LedgerAccountId;
  direction: LedgerDirection;
  amountMinor: MinorUnitAmount;
  currency: CurrencyCode;
  createdAt: IsoDateTimeString;
}

export interface AccountBalanceSnapshot {
  id: AccountBalanceSnapshotId;
  accountId: LedgerAccountId;
  balanceMinor: MinorUnitAmount;
  asOfLedgerEntryId: LedgerEntryId;
  createdAt: IsoDateTimeString;
}

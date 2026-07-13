import "server-only";

import { AppError } from "@/application/errors";
import type { IdentityProvider } from "@/application/auth";
import type {
  DepositIntentRecord,
  IdentityRepository,
  LedgerRepository,
  PaymentRepository,
  WalletBalanceRecord,
  WalletLedgerEventRecord,
  WithdrawalRequestRecord,
} from "@/infrastructure/database";

const DEFAULT_CURRENCY = "USD";

export interface CustomerWalletServiceDependencies {
  identityProvider: IdentityProvider;
  identityRepository: IdentityRepository;
  ledgerRepository: LedgerRepository;
  paymentRepository: PaymentRepository;
}

export class CustomerWalletService {
  constructor(private readonly deps: CustomerWalletServiceDependencies) {}

  async getWalletOverview(currency = DEFAULT_CURRENCY) {
    const appUser = await this.requireCurrentAppUser();
    const [balance, deposits, withdrawals, ledgerEvents] = await Promise.all([
      this.deps.ledgerRepository.findWalletBalanceByUserCurrency(appUser.id, currency),
      this.deps.paymentRepository.listDepositIntentsByUserId(appUser.id, 20),
      this.deps.paymentRepository.listWithdrawalsByUserId(appUser.id, 20),
      this.deps.ledgerRepository.listWalletLedgerEvents(appUser.id, currency, 12),
    ]);

    return {
      balances: serializeBalances(balance, currency),
      vocabulary: BALANCE_VOCABULARY,
      recentActivity: buildMoneyTimeline(deposits, withdrawals, ledgerEvents).slice(0, 8),
      recentDeposits: deposits.slice(0, 5).map(serializeDeposit),
      recentWithdrawals: withdrawals.slice(0, 5).map(serializeWithdrawal),
      pendingDepositCount: deposits.filter((row) =>
        row.status === "created" || row.status === "pending",
      ).length,
      openWithdrawalCount: withdrawals.filter((row) =>
        !["paid", "rejected", "failed", "cancelled"].includes(row.status),
      ).length,
    };
  }

  async listDeposits() {
    const appUser = await this.requireCurrentAppUser();
    const deposits = await this.deps.paymentRepository.listDepositIntentsByUserId(appUser.id, 50);
    return { deposits: deposits.map(serializeDeposit) };
  }

  async getDeposit(depositId: string) {
    const appUser = await this.requireCurrentAppUser();
    const deposit = await this.deps.paymentRepository.findDepositIntentById(depositId);
    if (!deposit || deposit.userId !== appUser.id) {
      throw new AppError({ code: "NOT_FOUND", message: "Deposit was not found." });
    }

    return {
      deposit: serializeDeposit(deposit),
      timeline: buildDepositTimeline(deposit),
      canCancel: deposit.status === "created" || deposit.status === "pending",
    };
  }

  async listWithdrawals() {
    const appUser = await this.requireCurrentAppUser();
    const withdrawals = await this.deps.paymentRepository.listWithdrawalsByUserId(appUser.id, 50);
    return { withdrawals: withdrawals.map(serializeWithdrawal) };
  }

  async getWithdrawal(withdrawalId: string) {
    const appUser = await this.requireCurrentAppUser();
    const withdrawal = await this.deps.paymentRepository.findWithdrawalById(withdrawalId);
    if (!withdrawal || withdrawal.userId !== appUser.id) {
      throw new AppError({ code: "NOT_FOUND", message: "Withdrawal was not found." });
    }

    return {
      withdrawal: serializeWithdrawal(withdrawal),
      timeline: buildWithdrawalTimeline(withdrawal),
      supportPath: {
        label: "Contact support",
        href: "/contact",
      },
    };
  }

  async listLedger(currency = DEFAULT_CURRENCY) {
    const appUser = await this.requireCurrentAppUser();
    const events = await this.deps.ledgerRepository.listWalletLedgerEvents(
      appUser.id,
      currency,
      50,
    );
    return {
      currency,
      entries: events.map(serializeLedgerEvent),
    };
  }

  async getMoneyTimeline(currency = DEFAULT_CURRENCY) {
    const appUser = await this.requireCurrentAppUser();
    const [deposits, withdrawals, ledgerEvents] = await Promise.all([
      this.deps.paymentRepository.listDepositIntentsByUserId(appUser.id, 50),
      this.deps.paymentRepository.listWithdrawalsByUserId(appUser.id, 50),
      this.deps.ledgerRepository.listWalletLedgerEvents(appUser.id, currency, 50),
    ]);

    return {
      items: buildMoneyTimeline(deposits, withdrawals, ledgerEvents),
    };
  }

  private async requireCurrentAppUser() {
    const currentUser = await this.deps.identityProvider.getCurrentUser();

    if (!currentUser) {
      throw new AppError({ code: "AUTHENTICATION_ERROR", message: "Authentication is required." });
    }

    const appUser = await this.deps.identityRepository.findUserByAuthUserId(currentUser.authUserId);

    if (!appUser) {
      throw new AppError({
        code: "AUTHENTICATION_ERROR",
        message: "Authenticated user is not registered.",
      });
    }

    return appUser;
  }
}

export const BALANCE_VOCABULARY = [
  {
    id: "available",
    label: "Available",
    customerWording: "Spendable and withdrawable now.",
    source: "Ledger available cash (FI-200)",
  },
  {
    id: "pending",
    label: "Pending",
    customerWording: "Not final yet — usually an in-flight deposit.",
    source: "Ledger pending cash (FI-202)",
  },
  {
    id: "locked",
    label: "Locked",
    customerWording: "Committed to investments or platform rules.",
    source: "Ledger locked principal (FI-203)",
  },
  {
    id: "withdrawable",
    label: "Withdrawable",
    customerWording: "Same as Available for withdrawals.",
    source: "Available balance only (FI-900)",
  },
  {
    id: "reserved",
    label: "Reserved",
    customerWording: "Held for an in-flight withdrawal.",
    source: "Ledger reserved withdrawal",
  },
  {
    id: "credited",
    label: "Credited earnings",
    customerWording: "ROI already posted to the ledger — not a separate wallet pile.",
    source: "Posted settlement / ledger events",
  },
  {
    id: "accrued",
    label: "Accrued earnings",
    customerWording: "Scheduled but not credited — never available in the wallet.",
    source: "Investment schedule (Portfolio)",
  },
] as const;

export function serializeBalances(balance: WalletBalanceRecord | null, currency: string) {
  const available = balance?.availableBalanceMinor ?? 0n;
  const pending = balance?.pendingBalanceMinor ?? 0n;
  const locked = balance?.lockedBalanceMinor ?? 0n;
  const reserved = balance?.reservedBalanceMinor ?? 0n;
  const withdrawn = balance?.withdrawnBalanceMinor ?? 0n;

  return {
    currency,
    availableBalanceMinor: available.toString(),
    pendingBalanceMinor: pending.toString(),
    lockedBalanceMinor: locked.toString(),
    reservedBalanceMinor: reserved.toString(),
    withdrawnBalanceMinor: withdrawn.toString(),
    withdrawableBalanceMinor: available.toString(),
    lastEntryAt: balance?.lastEntryAt?.toISOString() ?? null,
  };
}

export function serializeDeposit(deposit: DepositIntentRecord) {
  return {
    id: deposit.id,
    provider: deposit.provider,
    currency: deposit.currency,
    amountMinor: deposit.amountMinor.toString(),
    status: deposit.status,
    providerAuthorizationUrl: deposit.providerAuthorizationUrl,
    createdAt: deposit.createdAt.toISOString(),
    confirmedAt: deposit.confirmedAt?.toISOString() ?? null,
    updatedAt: deposit.updatedAt.toISOString(),
  };
}

export function serializeWithdrawal(withdrawal: WithdrawalRequestRecord) {
  return {
    id: withdrawal.id,
    currency: withdrawal.currency,
    amountMinor: withdrawal.amountMinor.toString(),
    destinationType: withdrawal.destinationType,
    destinationReference: withdrawal.destinationReference,
    status: withdrawal.status,
    reviewReason: withdrawal.reviewReason,
    createdAt: withdrawal.createdAt.toISOString(),
    paidAt: withdrawal.paidAt?.toISOString() ?? null,
    updatedAt: withdrawal.updatedAt.toISOString(),
  };
}

export function serializeLedgerEvent(event: WalletLedgerEventRecord) {
  return {
    id: event.transactionId,
    transactionType: event.transactionType,
    label: presentLedgerTransactionType(event.transactionType),
    referenceType: event.referenceType,
    referenceId: event.referenceId,
    description: event.description,
    amountMinor: event.amountMinor.toString(),
    direction: event.direction,
    currency: event.currency,
    walletCategory: event.walletCategory,
    postedAt: event.postedAt.toISOString(),
    href: resolveLedgerHref(event),
  };
}

export function presentLedgerTransactionType(type: string): string {
  const labels: Record<string, string> = {
    deposit_confirmation: "Deposit credited",
    deposit_reversal: "Deposit reversed",
    investment_funding: "Investment funded",
    roi_settlement: "ROI credited",
    maturity_principal_release: "Principal released",
    withdrawal_reservation: "Withdrawal reserved",
    withdrawal_payment: "Withdrawal paid",
    withdrawal_release: "Withdrawal release",
    referral_reward: "Referral reward",
    ledger_correction: "Ledger correction",
  };
  return labels[type] ?? type.replaceAll("_", " ");
}

export function buildDepositTimeline(deposit: DepositIntentRecord) {
  const steps: Array<{
    key: string;
    label: string;
    complete: boolean;
    current: boolean;
    at: string | null;
    nextExpectedStep: string;
  }> = [
    {
      key: "created",
      label: "Deposit created",
      complete: true,
      current: deposit.status === "created",
      at: deposit.createdAt.toISOString(),
      nextExpectedStep: "Complete payment if prompted.",
    },
    {
      key: "pending",
      label: "Awaiting confirmation",
      complete: ["pending", "confirmed", "reversed"].includes(deposit.status),
      current: deposit.status === "pending",
      at: deposit.status === "pending" ? deposit.updatedAt.toISOString() : null,
      nextExpectedStep: "Wait for provider or review confirmation.",
    },
    {
      key: "confirmed",
      label: "Available",
      complete: deposit.status === "confirmed" || deposit.status === "reversed",
      current: deposit.status === "confirmed",
      at: deposit.confirmedAt?.toISOString() ?? null,
      nextExpectedStep: "Use funds in wallet or invest.",
    },
  ];

  if (deposit.status === "failed") {
    steps.push({
      key: "failed",
      label: "Failed",
      complete: true,
      current: true,
      at: deposit.updatedAt.toISOString(),
      nextExpectedStep: "Retry with a new deposit or contact support.",
    });
  }
  if (deposit.status === "cancelled") {
    steps.push({
      key: "cancelled",
      label: "Cancelled",
      complete: true,
      current: true,
      at: deposit.updatedAt.toISOString(),
      nextExpectedStep: "Start a new deposit if needed.",
    });
  }
  if (deposit.status === "reversed") {
    steps.push({
      key: "reversed",
      label: "Reversed",
      complete: true,
      current: true,
      at: deposit.updatedAt.toISOString(),
      nextExpectedStep: "Review wallet activity; contact support if unclear.",
    });
  }

  return steps;
}

export function buildWithdrawalTimeline(withdrawal: WithdrawalRequestRecord) {
  const order = [
    "requested",
    "reserved",
    "under_review",
    "approved",
    "processing",
    "paid",
  ] as const;
  const currentIndex = order.indexOf(
    withdrawal.status as (typeof order)[number],
  );

  const steps: Array<{
    key: string;
    label: string;
    complete: boolean;
    current: boolean;
    at: string | null;
    nextExpectedStep: string;
  }> = order.map((key, index) => {
    const labels: Record<(typeof order)[number], string> = {
      requested: "Requested",
      reserved: "Funds reserved",
      under_review: "Under review",
      approved: "Approved",
      processing: "Processing",
      paid: "Paid",
    };
    const next: Record<(typeof order)[number], string> = {
      requested: "Reservation or review begins.",
      reserved: "Review or approval.",
      under_review: "Wait for approve or reject.",
      approved: "Provider payout processing.",
      processing: "Wait for paid or failure update.",
      paid: "Confirm receipt at your destination.",
    };

    return {
      key,
      label: labels[key],
      complete: currentIndex >= 0 ? index <= currentIndex : false,
      current: withdrawal.status === key,
      at:
        key === "requested"
          ? withdrawal.createdAt.toISOString()
          : key === "paid"
            ? withdrawal.paidAt?.toISOString() ?? null
            : null,
      nextExpectedStep: next[key],
    };
  });

  if (withdrawal.status === "rejected" || withdrawal.status === "failed" || withdrawal.status === "cancelled") {
    steps.push({
      key: withdrawal.status,
      label:
        withdrawal.status === "rejected"
          ? "Rejected"
          : withdrawal.status === "failed"
            ? "Failed"
            : "Cancelled",
      complete: true,
      current: true,
      at: withdrawal.updatedAt.toISOString(),
      nextExpectedStep:
        withdrawal.status === "rejected"
          ? "Read reason if shown; adjust and retry or contact support."
          : withdrawal.status === "failed"
            ? "Use support recovery; do not assume a silent retry."
            : "Request again if still eligible.",
    });
  }

  return steps;
}

export function buildMoneyTimeline(
  deposits: DepositIntentRecord[],
  withdrawals: WithdrawalRequestRecord[],
  ledgerEvents: WalletLedgerEventRecord[],
) {
  const items = [
    ...deposits.map((deposit) => ({
      id: `deposit:${deposit.id}`,
      kind: "deposit" as const,
      title: "Deposit",
      amountMinor: deposit.amountMinor.toString(),
      currency: deposit.currency,
      status: deposit.status,
      at: deposit.updatedAt.toISOString(),
      href: `/wallet/deposits/${deposit.id}`,
    })),
    ...withdrawals.map((withdrawal) => ({
      id: `withdrawal:${withdrawal.id}`,
      kind: "withdrawal" as const,
      title: "Withdrawal",
      amountMinor: withdrawal.amountMinor.toString(),
      currency: withdrawal.currency,
      status: withdrawal.status,
      at: withdrawal.updatedAt.toISOString(),
      href: `/wallet/withdrawals/${withdrawal.id}`,
    })),
    ...ledgerEvents
      .filter((event) => event.transactionType === "roi_settlement")
      .map((event) => ({
        id: `ledger:${event.transactionId}`,
        kind: "credit" as const,
        title: "ROI credited",
        amountMinor: event.amountMinor.toString(),
        currency: event.currency,
        status: "posted",
        at: event.postedAt.toISOString(),
        href: "/ledger",
      })),
  ];

  return items.sort((left, right) => Date.parse(right.at) - Date.parse(left.at));
}

function resolveLedgerHref(event: WalletLedgerEventRecord): string | null {
  if (event.referenceType === "deposit_intent") {
    return `/wallet/deposits/${event.referenceId}`;
  }
  if (event.referenceType === "withdrawal_request") {
    return `/wallet/withdrawals/${event.referenceId}`;
  }
  if (event.referenceType === "investment") {
    return `/portfolio/${event.referenceId}`;
  }
  return null;
}

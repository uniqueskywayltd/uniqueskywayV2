import { describe, expect, it } from "vitest";

import {
  buildDepositTimeline,
  buildMoneyTimeline,
  buildWithdrawalTimeline,
  presentLedgerTransactionType,
  serializeBalances,
} from "@/application/customer/wallet-service";
import {
  pickPrimaryWalletLedgerEvents,
  type DepositIntentRecord,
  type WalletLedgerEventRecord,
  type WithdrawalRequestRecord,
} from "@/infrastructure/database";

describe("customer wallet helpers", () => {
  it("maps null balance to zero strings with withdrawable = available", () => {
    const balances = serializeBalances(null, "USD");
    expect(balances.availableBalanceMinor).toBe("0");
    expect(balances.withdrawableBalanceMinor).toBe("0");
    expect(balances.currency).toBe("USD");
  });

  it("builds deposit timeline with next steps", () => {
    const timeline = buildDepositTimeline(
      makeDeposit({ status: "pending" }),
    );
    expect(timeline.some((step) => step.key === "pending" && step.current)).toBe(true);
    expect(timeline[0]?.nextExpectedStep).toContain("payment");
  });

  it("builds withdrawal anxiety timeline", () => {
    const timeline = buildWithdrawalTimeline(makeWithdrawal({ status: "under_review" }));
    const current = timeline.find((step) => step.current);
    expect(current?.key).toBe("under_review");
    expect(current?.nextExpectedStep).toContain("approve");
  });

  it("merges money timeline newest first", () => {
    const items = buildMoneyTimeline(
      [makeDeposit({ id: "d1", status: "confirmed", updatedAt: new Date("2026-07-02T00:00:00Z") })],
      [makeWithdrawal({ id: "w1", status: "requested", updatedAt: new Date("2026-07-03T00:00:00Z") })],
      [],
    );
    expect(items[0]?.kind).toBe("withdrawal");
    expect(items[1]?.kind).toBe("deposit");
  });

  it("labels ledger transaction types for customers", () => {
    expect(presentLedgerTransactionType("roi_settlement")).toBe("ROI credited");
  });

  it("picks primary wallet ledger leg per transaction", () => {
    const picked = pickPrimaryWalletLedgerEvents(
      [
        event({ transactionId: "t1", walletCategory: "locked", amountMinor: 1n }),
        event({ transactionId: "t1", walletCategory: "available", amountMinor: 5n }),
        event({ transactionId: "t2", walletCategory: "pending", amountMinor: 2n }),
      ],
      10,
    );
    expect(picked).toHaveLength(2);
    expect(picked.find((row) => row.transactionId === "t1")?.walletCategory).toBe("available");
  });
});

function makeDeposit(overrides: Partial<DepositIntentRecord> = {}): DepositIntentRecord {
  return {
    id: "dep_1",
    userId: "user_1",
    provider: "paystack",
    providerIntentId: "ref_1",
    currency: "USD",
    amountMinor: 10_000n,
    status: "created",
    idempotencyKey: "idem_1",
    providerAuthorizationUrl: null,
    providerAccessCode: null,
    providerMetadata: {},
    failureReason: null,
    confirmationLedgerTransactionId: null,
    reversalLedgerTransactionId: null,
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    confirmedAt: null,
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
    ...overrides,
  };
}

function makeWithdrawal(overrides: Partial<WithdrawalRequestRecord> = {}): WithdrawalRequestRecord {
  return {
    id: "wd_1",
    userId: "user_1",
    currency: "USD",
    amountMinor: 5_000n,
    destinationType: "paystack_recipient",
    destinationReference: "RCP_1",
    status: "requested",
    riskScore: null,
    reviewedBy: null,
    reviewedAt: null,
    reviewReason: null,
    idempotencyKey: "idem_w1",
    provider: null,
    providerPayoutReference: null,
    providerMetadata: {},
    failureReason: null,
    reservationLedgerTransactionId: null,
    paymentLedgerTransactionId: null,
    releaseLedgerTransactionId: null,
    payoutInitiatedAt: null,
    paidAt: null,
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
    ...overrides,
  };
}

function event(
  overrides: Partial<WalletLedgerEventRecord> &
    Pick<WalletLedgerEventRecord, "transactionId" | "walletCategory" | "amountMinor">,
): WalletLedgerEventRecord {
  return {
    transactionType: "deposit_confirmation",
    referenceType: "deposit_intent",
    referenceId: "dep_1",
    description: null,
    postedAt: new Date("2026-07-01T00:00:00.000Z"),
    direction: "credit",
    currency: "USD",
    ...overrides,
  };
}

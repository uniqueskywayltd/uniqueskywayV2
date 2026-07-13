import { describe, expect, it } from "vitest";

import {
  LedgerPostingInvariantError,
  assertBalancedLedgerPosting,
  createDepositConfirmationEntries,
  createDepositReversalEntries,
  createInvestmentFundingEntries,
  createMaturityPrincipalReleaseEntries,
  createRoiSettlementEntries,
  createWithdrawalPaymentEntries,
  createWithdrawalReleaseEntries,
  createWithdrawalReservationEntries,
} from "./posting";

describe("ledger posting domain rules", () => {
  it("accepts balanced investment funding entries", () => {
    const entries = createInvestmentFundingEntries({
      availableAccountId: "available",
      lockedAccountId: "locked",
      amountMinor: 10_000n,
      currency: "USD",
    });

    expect(() => assertBalancedLedgerPosting({ entries })).not.toThrow();
  });

  it("accepts balanced deposit confirmation and reversal entries", () => {
    expect(() =>
      assertBalancedLedgerPosting({
        entries: createDepositConfirmationEntries({
          providerClearingAccountId: "provider_cash_clearing",
          customerAvailableAccountId: "available",
          amountMinor: 10_000n,
          currency: "USD",
        }),
      }),
    ).not.toThrow();
    expect(() =>
      assertBalancedLedgerPosting({
        entries: createDepositReversalEntries({
          customerAvailableAccountId: "available",
          providerClearingAccountId: "provider_cash_clearing",
          amountMinor: 10_000n,
          currency: "USD",
        }),
      }),
    ).not.toThrow();
  });

  it("accepts balanced ROI and maturity entries", () => {
    expect(() =>
      assertBalancedLedgerPosting({
        entries: createRoiSettlementEntries({
          platformRoiExpenseAccountId: "platform_roi",
          customerAvailableAccountId: "available",
          amountMinor: 50n,
          currency: "USD",
        }),
      }),
    ).not.toThrow();
    expect(() =>
      assertBalancedLedgerPosting({
        entries: createMaturityPrincipalReleaseEntries({
          lockedAccountId: "locked",
          availableAccountId: "available",
          amountMinor: 10_000n,
          currency: "USD",
        }),
      }),
    ).not.toThrow();
  });

  it("accepts balanced withdrawal reservation, payment, and release entries", () => {
    expect(() =>
      assertBalancedLedgerPosting({
        entries: createWithdrawalReservationEntries({
          customerAvailableAccountId: "available",
          customerReservedAccountId: "reserved",
          amountMinor: 10_000n,
          currency: "USD",
        }),
      }),
    ).not.toThrow();
    expect(() =>
      assertBalancedLedgerPosting({
        entries: createWithdrawalPaymentEntries({
          customerReservedAccountId: "reserved",
          customerWithdrawnAccountId: "withdrawn",
          amountMinor: 10_000n,
          currency: "USD",
        }),
      }),
    ).not.toThrow();
    expect(() =>
      assertBalancedLedgerPosting({
        entries: createWithdrawalReleaseEntries({
          customerReservedAccountId: "reserved",
          customerAvailableAccountId: "available",
          amountMinor: 10_000n,
          currency: "USD",
        }),
      }),
    ).not.toThrow();
  });

  it("rejects unbalanced postings before persistence", () => {
    expect(() =>
      assertBalancedLedgerPosting({
        entries: [
          { accountId: "a", direction: "debit", amountMinor: 100n, currency: "USD" },
          { accountId: "b", direction: "credit", amountMinor: 99n, currency: "USD" },
        ],
      }),
    ).toThrow(LedgerPostingInvariantError);
  });

  it("rejects non-positive ledger entry amounts", () => {
    expect(() =>
      assertBalancedLedgerPosting({
        entries: [
          { accountId: "a", direction: "debit", amountMinor: 0n, currency: "USD" },
          { accountId: "b", direction: "credit", amountMinor: 0n, currency: "USD" },
        ],
      }),
    ).toThrow("positive minor units");
  });
});

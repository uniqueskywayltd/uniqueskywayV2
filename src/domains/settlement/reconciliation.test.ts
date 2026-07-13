import { describe, expect, it } from "vitest";

import { reconcileInvestment } from "./reconciliation";

describe("investment reconciliation", () => {
  it("passes when settlement, ROI ledger, ledger, and locked principal agree", () => {
    const result = reconcileInvestment({
      investmentId: "investment_1",
      settlementPostedRoiMinor: 300n,
      roiLedgerPostedRoiMinor: 300n,
      ledgerPostedRoiMinor: 300n,
      lockedPrincipalMinor: 10_000n,
      expectedLockedPrincipalMinor: 10_000n,
    });

    expect(result.passed).toBe(true);
    expect(result.differences).toEqual([]);
  });

  it("reports every mismatch without mutating history", () => {
    const result = reconcileInvestment({
      investmentId: "investment_1",
      settlementPostedRoiMinor: 300n,
      roiLedgerPostedRoiMinor: 250n,
      ledgerPostedRoiMinor: 200n,
      lockedPrincipalMinor: 8_000n,
      expectedLockedPrincipalMinor: 10_000n,
    });

    expect(result.passed).toBe(false);
    expect(result.differences.map((difference) => difference.code)).toEqual([
      "SETTLEMENT_ROI_MISMATCH",
      "LEDGER_ROI_MISMATCH",
      "LOCKED_PRINCIPAL_MISMATCH",
    ]);
  });
});

export interface InvestmentReconciliationInput {
  investmentId: string;
  settlementPostedRoiMinor: bigint;
  roiLedgerPostedRoiMinor: bigint;
  ledgerPostedRoiMinor: bigint;
  lockedPrincipalMinor: bigint;
  expectedLockedPrincipalMinor: bigint;
}

export interface InvestmentReconciliationResult {
  investmentId: string;
  passed: boolean;
  differences: Array<{
    code: "SETTLEMENT_ROI_MISMATCH" | "LEDGER_ROI_MISMATCH" | "LOCKED_PRINCIPAL_MISMATCH";
    expectedMinor: bigint;
    actualMinor: bigint;
  }>;
}

export function reconcileInvestment(
  input: InvestmentReconciliationInput,
): InvestmentReconciliationResult {
  const differences: InvestmentReconciliationResult["differences"] = [];

  if (input.settlementPostedRoiMinor !== input.roiLedgerPostedRoiMinor) {
    differences.push({
      code: "SETTLEMENT_ROI_MISMATCH",
      expectedMinor: input.settlementPostedRoiMinor,
      actualMinor: input.roiLedgerPostedRoiMinor,
    });
  }

  if (input.roiLedgerPostedRoiMinor !== input.ledgerPostedRoiMinor) {
    differences.push({
      code: "LEDGER_ROI_MISMATCH",
      expectedMinor: input.roiLedgerPostedRoiMinor,
      actualMinor: input.ledgerPostedRoiMinor,
    });
  }

  if (input.expectedLockedPrincipalMinor !== input.lockedPrincipalMinor) {
    differences.push({
      code: "LOCKED_PRINCIPAL_MISMATCH",
      expectedMinor: input.expectedLockedPrincipalMinor,
      actualMinor: input.lockedPrincipalMinor,
    });
  }

  return {
    investmentId: input.investmentId,
    passed: differences.length === 0,
    differences,
  };
}

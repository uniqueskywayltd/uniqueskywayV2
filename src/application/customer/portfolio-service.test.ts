import { describe, expect, it } from "vitest";

import {
  buildPortfolioSummary,
  computeProgressPercent,
  resolveNextMilestone,
  sortInvestments,
} from "@/application/customer/portfolio-service";
import type { InvestmentRecord } from "@/infrastructure/database";

function makeInvestment(
  overrides: Partial<InvestmentRecord> & Pick<InvestmentRecord, "id" | "status">,
): InvestmentRecord {
  return {
    userId: "user_1",
    planVersionId: "plan_v_1",
    currency: "USD",
    principalMinor: 100_00n,
    dailyRoiBps: 10,
    totalRoiBps: null,
    promisedRoiMinor: null,
    termDays: 30,
    principalReturnPolicy: "return_at_maturity",
    calculationVersion: "v1",
    idempotencyKey: null,
    startAt: null,
    firstSettlementDate: "2026-01-01",
    maturityDate: "2026-01-31",
    roundingResidualMicroMinor: 0n,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    activatedAt: new Date("2026-01-01T00:00:00.000Z"),
    maturedAt: null,
    cancelledAt: null,
    fundingLedgerTransactionId: null,
    maturityLedgerTransactionId: null,
    ...overrides,
  };
}

describe("customer portfolio helpers", () => {
  it("summarizes active principal without inventing ROI", () => {
    const summary = buildPortfolioSummary([
      makeInvestment({ id: "a", status: "active", principalMinor: 100_00n }),
      makeInvestment({ id: "b", status: "matured", principalMinor: 50_00n }),
    ]);
    expect(summary.totalCount).toBe(2);
    expect(summary.activePrincipalMinor).toBe("10000");
    expect(summary.byStatus.matured).toBe(1);
  });

  it("sorts by maturity date", () => {
    const sorted = sortInvestments(
      [
        makeInvestment({ id: "late", status: "active", maturityDate: "2026-03-01" }),
        makeInvestment({ id: "soon", status: "active", maturityDate: "2026-02-01" }),
      ],
      "maturity",
    );
    expect(sorted[0]?.id).toBe("soon");
  });

  it("computes matured progress as 100%", () => {
    expect(
      computeProgressPercent(makeInvestment({ id: "m", status: "matured" })),
    ).toBe(100);
  });

  it("resolves pending milestone copy", () => {
    expect(resolveNextMilestone(makeInvestment({ id: "p", status: "pending" }))).toEqual({
      label: "Awaiting activation",
      date: null,
    });
  });
});

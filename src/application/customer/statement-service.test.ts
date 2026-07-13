import { describe, expect, it } from "vitest";

import {
  buildStatementDetail,
  buildStatementList,
  isInvestmentLedgerEvent,
  nyPeriodKey,
  parseStatementId,
  periodBoundsLabel,
  summarizeLines,
} from "@/application/customer/statement-service";
import type { WalletLedgerEventRecord } from "@/infrastructure/database";

describe("customer statement helpers", () => {
  it("parses statement ids", () => {
    expect(parseStatementId("monthly-2026-06")).toEqual({
      type: "monthly",
      periodKey: "2026-06",
    });
    expect(parseStatementId("monthly:2026-06")).toEqual({
      type: "monthly",
      periodKey: "2026-06",
    });
    expect(parseStatementId("bad")).toBeNull();
  });

  it("uses New York month keys", () => {
    // 2026-06-01 04:00 UTC is still 2026-05-31 evening in NY → May
    expect(nyPeriodKey(new Date("2026-06-01T03:00:00.000Z"))).toBe("2026-05");
    expect(nyPeriodKey(new Date("2026-06-01T12:00:00.000Z"))).toBe("2026-06");
  });

  it("builds period bounds labels", () => {
    expect(periodBoundsLabel("2026-06")).toBe("2026-06-01 → 2026-06-30 (NY)");
  });

  it("sums credits and debits from ledger lines only", () => {
    const summary = summarizeLines([
      event({ amountMinor: 1000n, direction: "credit" }),
      event({ amountMinor: 250n, direction: "debit" }),
    ]);
    expect(summary.creditTotalMinor).toBe("1000");
    expect(summary.debitTotalMinor).toBe("250");
    expect(summary.periodNetMinor).toBe("750");
  });

  it("lists monthly/wallet/investment projections without inventing balances", () => {
    const events = [
      event({
        transactionId: "t1",
        transactionType: "deposit_confirmation",
        postedAt: new Date("2026-06-15T15:00:00.000Z"),
        amountMinor: 5000n,
        direction: "credit",
        walletCategory: "available",
      }),
      event({
        transactionId: "t2",
        transactionType: "roi_settlement",
        referenceType: "investment",
        postedAt: new Date("2026-06-16T15:00:00.000Z"),
        amountMinor: 100n,
        direction: "credit",
        walletCategory: "available",
      }),
    ];
    const list = buildStatementList(events, "2026-07-13T12:00:00.000Z");
    expect(list.some((row) => row.id === "monthly-2026-06")).toBe(true);
    expect(list.find((row) => row.id === "investment-2026-06")?.lineCount).toBe(1);
    expect(list.every((row) => row.status === "ready")).toBe(true);
  });

  it("builds detail with understanding footer and period net note", () => {
    const detail = buildStatementDetail(
      [
        event({
          transactionType: "deposit_confirmation",
          postedAt: new Date("2026-06-15T15:00:00.000Z"),
          amountMinor: 5000n,
          direction: "credit",
        }),
      ],
      "monthly",
      "2026-06",
      "2026-07-13T12:00:00.000Z",
    );
    expect(detail?.summary.note).toContain("not available balance");
    expect(detail?.footer).toContain("not tax advice");
    expect(detail?.timezone).toBe("America/New_York");
    expect(detail?.lines).toHaveLength(1);
  });

  it("detects investment ledger events", () => {
    expect(
      isInvestmentLedgerEvent(event({ transactionType: "roi_settlement" })),
    ).toBe(true);
    expect(
      isInvestmentLedgerEvent(event({ transactionType: "deposit_confirmation" })),
    ).toBe(false);
  });
});

function event(overrides: Partial<WalletLedgerEventRecord> = {}): WalletLedgerEventRecord {
  return {
    transactionId: "tx_1",
    transactionType: "deposit_confirmation",
    referenceType: "deposit_intent",
    referenceId: "dep_1",
    description: null,
    postedAt: new Date("2026-06-15T15:00:00.000Z"),
    amountMinor: 100n,
    direction: "credit",
    currency: "USD",
    walletCategory: "available",
    ...overrides,
  };
}

import { describe, expect, it } from "vitest";

import {
  addNewYorkDays,
  enumerateNewYorkDatesInclusive,
  firstSettlementDate,
  isCompletedSettlementDate,
  maturityDate,
  toNewYorkDate,
} from "./new-york-calendar";

describe("New York settlement calendar", () => {
  it("uses New York calendar dates instead of UTC dates", () => {
    expect(toNewYorkDate(new Date("2026-07-13T03:59:59.000Z"))).toBe("2026-07-12");
    expect(toNewYorkDate(new Date("2026-07-13T04:00:00.000Z"))).toBe("2026-07-13");
  });

  it("sets first settlement to the day after New York activation", () => {
    expect(firstSettlementDate(new Date("2026-07-13T03:59:59.000Z"))).toBe("2026-07-13");
    expect(firstSettlementDate(new Date("2026-07-13T04:00:00.000Z"))).toBe("2026-07-14");
  });

  it("handles DST start and end as calendar days", () => {
    expect(addNewYorkDays("2026-03-07", 1)).toBe("2026-03-08");
    expect(addNewYorkDays("2026-03-08", 1)).toBe("2026-03-09");
    expect(addNewYorkDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addNewYorkDays("2026-11-01", 1)).toBe("2026-11-02");
  });

  it("calculates maturity as the final eligible earning date", () => {
    expect(maturityDate("2026-07-13", 1)).toBe("2026-07-13");
    expect(maturityDate("2026-07-13", 90)).toBe("2026-10-10");
  });

  it("settles only completed New York days", () => {
    expect(isCompletedSettlementDate("2026-07-12", new Date("2026-07-13T05:00:00.000Z"))).toBe(
      true,
    );
    expect(isCompletedSettlementDate("2026-07-13", new Date("2026-07-13T05:00:00.000Z"))).toBe(
      false,
    );
  });

  it("enumerates date ranges inclusively", () => {
    expect(enumerateNewYorkDatesInclusive("2026-02-27", "2026-03-02")).toEqual([
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
      "2026-03-02",
    ]);
  });
});

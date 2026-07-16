import { describe, expect, it } from "vitest";

import {
  MICRO_MINOR_UNITS_PER_MINOR,
  calculateContinuousLiveAccrual,
  calculateDailyRoi,
  calculateLiveEarnings,
  calculatePromisedRoiMinor,
  generateRoiSchedule,
  proveTermRoi,
} from "./roi-math";

describe("ROI math", () => {
  it("carries micro-minor residuals without floating point money", () => {
    const first = calculateDailyRoi({
      principalMinor: 10_001n,
      dailyRoiBps: 1,
      previousResidualMicroMinor: 0n,
    });
    const second = calculateDailyRoi({
      principalMinor: 10_001n,
      dailyRoiBps: 1,
      previousResidualMicroMinor: first.nextResidualMicroMinor,
    });

    expect(first.grossRoiMicroMinor).toBe(1_000_100n);
    expect(first.postedRoiMinor).toBe(1n);
    expect(first.nextResidualMicroMinor).toBe(100n);
    expect(second.postedRoiMinor).toBe(1n);
    expect(second.nextResidualMicroMinor).toBe(200n);
  });

  it("forces final promised ROI remainder on the last eligible day", () => {
    const proof = proveTermRoi({
      principalMinor: 100_00n,
      dailyRoiBps: 33,
      termDays: 3,
      promisedRoiMinor: 100n,
    });

    expect(proof.totalPostedRoiMinor).toBe(100n);
    expect(proof.finalResidualMicroMinor).toBe(0n);
  });

  it("calculates promised ROI from total basis points in whole minor units", () => {
    expect(calculatePromisedRoiMinor({ principalMinor: 12_345n, totalRoiBps: 250 })).toBe(308n);
    expect(calculatePromisedRoiMinor({ principalMinor: 12_345n, totalRoiBps: null })).toBeNull();
  });

  it("generates a deterministic New York earning schedule", () => {
    const schedule = generateRoiSchedule({
      investmentId: "investment_1",
      principalMinor: 50_000n,
      dailyRoiBps: 25,
      firstSettlementDate: "2026-03-07",
      termDays: 4,
    });

    expect(schedule.map((item) => item.earningDate)).toEqual([
      "2026-03-07",
      "2026-03-08",
      "2026-03-09",
      "2026-03-10",
    ]);
    expect(schedule[0]?.expectedRoiMicroMinor).toBe(125_000_000n);
  });

  it("keeps live earnings visual and independent of wallet balances", () => {
    const live = calculateLiveEarnings({
      principalMinor: 100_000n,
      dailyRoiBps: 100,
      firstSettlementDate: "2026-07-10",
      maturityDate: "2026-07-20",
      settledThroughDate: "2026-07-11",
      now: new Date("2026-07-14T16:00:00.000Z"),
    });

    expect(live.visualOnly).toBe(true);
    expect(live.previewStartDate).toBe("2026-07-12");
    expect(live.previewEndDate).toBe("2026-07-13");
    expect(live.previewedDays).toBe(2);
    expect(live.liveRoiMicroMinor).toBe(2_000n * MICRO_MINOR_UNITS_PER_MINOR);
    expect(live.liveRoiMinorFloor).toBe(2_000n);
  });

  it("accrues continuous live ROI per second without floating point money", () => {
    // Gold: 5.5% daily on $30,000 → $1,650/day → ~1.9097¢ per second
    const live = calculateContinuousLiveAccrual({
      principalMinor: 3_000_000n,
      dailyRoiBps: 550,
      activatedAt: new Date("2026-07-16T12:00:00.000Z"),
      termDays: 7,
      postedRoiMinor: 0n,
      promisedRoiMinor: 1_155_000n,
      now: new Date("2026-07-16T12:00:01.000Z"),
    });

    expect(live.visualOnly).toBe(true);
    expect(live.dailyRoiMinorFloor).toBe(165_000n);
    expect(live.elapsedSeconds).toBe(1);
    expect(live.accruedRoiMinor).toBe(1n);
    expect(live.todayEarningsMinor).toBe(1n);
    expect(live.currentValueMinor).toBe(3_000_001n);

    const afterHour = calculateContinuousLiveAccrual({
      principalMinor: 3_000_000n,
      dailyRoiBps: 550,
      activatedAt: new Date("2026-07-16T12:00:00.000Z"),
      termDays: 7,
      postedRoiMinor: 0n,
      promisedRoiMinor: 1_155_000n,
      now: new Date("2026-07-16T13:00:00.000Z"),
    });
    expect(afterHour.accruedRoiMinor).toBe(6_875n); // $68.75
  });

  it("proves capped ROI across deterministic randomized inputs", () => {
    let seed = 42n;

    for (let index = 0; index < 2_000; index += 1) {
      seed = (seed * 1_103_515_245n + 12_345n) % 2_147_483_648n;
      const principalMinor = (seed % 1_000_000n) + 1n;
      seed = (seed * 1_103_515_245n + 12_345n) % 2_147_483_648n;
      const dailyRoiBps = Number(seed % 500n);
      seed = (seed * 1_103_515_245n + 12_345n) % 2_147_483_648n;
      const termDays = Number(seed % 365n) + 1;
      seed = (seed * 1_103_515_245n + 12_345n) % 2_147_483_648n;
      const totalRoiBps = Number(seed % 5_000n);
      const promisedRoiMinor = calculatePromisedRoiMinor({ principalMinor, totalRoiBps });

      const proof = proveTermRoi({
        principalMinor,
        dailyRoiBps,
        termDays,
        promisedRoiMinor,
      });

      expect(proof.totalPostedRoiMinor).toBe(promisedRoiMinor);
      expect(proof.finalResidualMicroMinor).toBe(0n);
    }
  });
});

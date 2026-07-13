import { describe, expect, it } from "vitest";

import {
  BASIS_POINTS_DIVISOR,
  MICRO_MINOR_UNITS_PER_MINOR,
  calculateDailyRoi,
  calculatePromisedRoiMinor,
  proveTermRoi,
} from "./roi-math";

const CERTIFIED_MAX_DAILY_ROI_BPS = 10_000;
const CERTIFIED_MAX_TERM_DAYS = 1_825;
const RANDOMIZED_SIMULATION_COUNT = 100_000;

describe("Phase 6.1 ROI mathematics certification", () => {
  it(
    "proves 100,000 deterministic promised-total investment simulations",
    { timeout: 60_000 },
    () => {
      let seed = 86_753_091n;

      for (let index = 0; index < RANDOMIZED_SIMULATION_COUNT; index += 1) {
        seed = nextSeed(seed);
        const principalMinor = (seed % 10_000_000_000n) + 1n;
        seed = nextSeed(seed);
        const dailyRoiBps = Number(seed % BigInt(CERTIFIED_MAX_DAILY_ROI_BPS + 1));
        seed = nextSeed(seed);
        const termDays = Number(seed % 365n) + 1;
        seed = nextSeed(seed);
        const totalRoiBps = Number(seed % 50_001n);
        const promisedRoiMinor = calculatePromisedRoiMinor({ principalMinor, totalRoiBps });

        const proof = proveTermRoi({
          principalMinor,
          dailyRoiBps,
          termDays,
          promisedRoiMinor,
        });

        if (proof.totalPostedRoiMinor !== promisedRoiMinor) {
          throw new Error(
            `Promised ROI mismatch at simulation ${index}: expected ${promisedRoiMinor}, got ${proof.totalPostedRoiMinor}`,
          );
        }
        if (proof.finalResidualMicroMinor !== 0n) {
          throw new Error(
            `Final residual mismatch at simulation ${index}: expected 0, got ${proof.finalResidualMicroMinor}`,
          );
        }
      }
    },
  );

  it("sweeps every certified daily ROI basis-point value", () => {
    for (let dailyRoiBps = 0; dailyRoiBps <= CERTIFIED_MAX_DAILY_ROI_BPS; dailyRoiBps += 1) {
      const principalMinor = 123_456_789n + BigInt(dailyRoiBps);
      const termDays = 37;
      const proof = proveTermRoi({
        principalMinor,
        dailyRoiBps,
        termDays,
        promisedRoiMinor: null,
      });
      const expected = expectedUncappedTermRoi({
        principalMinor,
        dailyRoiBps,
        termDays,
      });

      expect(proof).toEqual(expected);
    }
  });

  it(
    "sweeps every certified term duration",
    { timeout: 30_000 },
    () => {
      for (let termDays = 1; termDays <= CERTIFIED_MAX_TERM_DAYS; termDays += 1) {
        const principalMinor = 9_876_543_210n + BigInt(termDays);
        const dailyRoiBps = termDays % 10_001;
        const uncappedProof = proveTermRoi({
          principalMinor,
          dailyRoiBps,
          termDays,
          promisedRoiMinor: null,
        });
        const expectedUncapped = expectedUncappedTermRoi({
          principalMinor,
          dailyRoiBps,
          termDays,
        });

        expect(uncappedProof).toEqual(expectedUncapped);

        const promisedRoiMinor = calculatePromisedRoiMinor({
          principalMinor,
          totalRoiBps: termDays % 50_001,
        });
        const promisedProof = proveTermRoi({
          principalMinor,
          dailyRoiBps,
          termDays,
          promisedRoiMinor,
        });

        expect(promisedProof.totalPostedRoiMinor).toBe(promisedRoiMinor);
        expect(promisedProof.finalResidualMicroMinor).toBe(0n);
      }
    },
  );

  it("handles very small principal without fractional cash postings", () => {
    const proof = proveTermRoi({
      principalMinor: 1n,
      dailyRoiBps: 1,
      termDays: 9_999,
      promisedRoiMinor: null,
    });

    expect(proof.totalPostedRoiMinor).toBe(0n);
    expect(proof.finalResidualMicroMinor).toBe(999_900n);
  });

  it("handles large principal with bigint arithmetic", () => {
    const principalMinor = 9_999_999_999_999_999n;
    const dailyRoiBps = 10_000;
    const termDays = 365;
    const proof = proveTermRoi({
      principalMinor,
      dailyRoiBps,
      termDays,
      promisedRoiMinor: null,
    });
    const expected = expectedUncappedTermRoi({ principalMinor, dailyRoiBps, termDays });

    expect(proof).toEqual(expected);
  });

  it("records zero ROI as zero posted cash with no residual", () => {
    const roi = calculateDailyRoi({
      principalMinor: 1_000_000n,
      dailyRoiBps: 0,
      previousResidualMicroMinor: 0n,
    });
    const proof = proveTermRoi({
      principalMinor: 1_000_000n,
      dailyRoiBps: 0,
      termDays: 365,
      promisedRoiMinor: 0n,
    });

    expect(roi.postedRoiMinor).toBe(0n);
    expect(roi.nextResidualMicroMinor).toBe(0n);
    expect(proof.totalPostedRoiMinor).toBe(0n);
    expect(proof.finalResidualMicroMinor).toBe(0n);
  });

  it("does not exceed a total ROI cap lower than daily formula output", () => {
    const principalMinor = 1_000_000n;
    const dailyRoiBps = 500;
    const termDays = 30;
    const promisedRoiMinor = calculatePromisedRoiMinor({
      principalMinor,
      totalRoiBps: 250,
    });
    const uncapped = expectedUncappedTermRoi({ principalMinor, dailyRoiBps, termDays });
    const capped = proveTermRoi({
      principalMinor,
      dailyRoiBps,
      termDays,
      promisedRoiMinor,
    });

    expect(uncapped.totalPostedRoiMinor).toBeGreaterThan(promisedRoiMinor ?? 0n);
    expect(capped.totalPostedRoiMinor).toBe(promisedRoiMinor);
    expect(capped.finalResidualMicroMinor).toBe(0n);
  });

  it("proves uncapped fixed-term ROI equals the cumulative integer formula", () => {
    const principalMinor = 1_337_42n;
    const dailyRoiBps = 275;
    const termDays = 17;
    const proof = proveTermRoi({
      principalMinor,
      dailyRoiBps,
      termDays,
      promisedRoiMinor: null,
    });
    const expected = expectedUncappedTermRoi({ principalMinor, dailyRoiBps, termDays });

    expect(proof).toEqual(expected);
    expect(proof.finalResidualMicroMinor).toBeGreaterThanOrEqual(0n);
    expect(proof.finalResidualMicroMinor).toBeLessThan(MICRO_MINOR_UNITS_PER_MINOR);
  });
});

function expectedUncappedTermRoi(input: {
  principalMinor: bigint;
  dailyRoiBps: number;
  termDays: number;
}) {
  const grossDailyMicroMinor =
    (input.principalMinor * MICRO_MINOR_UNITS_PER_MINOR * BigInt(input.dailyRoiBps)) /
    BASIS_POINTS_DIVISOR;
  const totalGrossMicroMinor = grossDailyMicroMinor * BigInt(input.termDays);

  return {
    totalPostedRoiMinor: totalGrossMicroMinor / MICRO_MINOR_UNITS_PER_MINOR,
    finalResidualMicroMinor: totalGrossMicroMinor % MICRO_MINOR_UNITS_PER_MINOR,
  };
}

function nextSeed(seed: bigint): bigint {
  return (seed * 48_271n) % 2_147_483_647n;
}

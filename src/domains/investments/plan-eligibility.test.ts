import { describe, expect, it } from "vitest";

import {
  CERTIFIED_PLAN_ELIGIBILITY_BANDS,
  resolvePlanBandForPrincipalMinor,
  resolvePlanSlugForPrincipalMinor,
} from "./plan-eligibility";

describe("plan eligibility assignment", () => {
  it("rejects amounts below the platform minimum", () => {
    expect(resolvePlanSlugForPrincipalMinor(4_999n)).toBeNull();
    expect(resolvePlanSlugForPrincipalMinor(0n)).toBeNull();
  });

  it("assigns Silver at lower and upper silver bounds", () => {
    expect(resolvePlanSlugForPrincipalMinor(5_000n)).toBe("silver");
    expect(resolvePlanSlugForPrincipalMinor(2_499_999n)).toBe("silver");
  });

  it("assigns Gold at lower and upper gold bounds", () => {
    expect(resolvePlanSlugForPrincipalMinor(2_500_000n)).toBe("gold");
    expect(resolvePlanSlugForPrincipalMinor(4_999_999n)).toBe("gold");
  });

  it("assigns Classic at lower and upper classic bounds", () => {
    expect(resolvePlanSlugForPrincipalMinor(5_000_000n)).toBe("classic");
    expect(resolvePlanSlugForPrincipalMinor(9_999_999n)).toBe("classic");
  });

  it("assigns Master from $100,000 upward", () => {
    expect(resolvePlanSlugForPrincipalMinor(10_000_000n)).toBe("master");
    expect(resolvePlanSlugForPrincipalMinor(50_000_000n)).toBe("master");
  });

  it("exposes certified ROI and duration for every band", () => {
    for (const band of CERTIFIED_PLAN_ELIGIBILITY_BANDS) {
      const resolved = resolvePlanBandForPrincipalMinor(band.minPrincipalMinor);
      expect(resolved?.slug).toBe(band.slug);
      expect(resolved?.dailyRoiBps).toBe(band.dailyRoiBps);
      expect(resolved?.termDays).toBe(band.termDays);
    }
  });
});

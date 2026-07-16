import { describe, expect, it } from "vitest";

import { buildInvestmentActivatedEmailFields } from "./investment-activated-fields";

describe("buildInvestmentActivatedEmailFields", () => {
  it("builds Gold plan fields from investment engine inputs", () => {
    const fields = buildInvestmentActivatedEmailFields({
      planName: "Gold Plan",
      investmentId: "inv_test_gold",
      principalMinor: 3_000_000n,
      currency: "USD",
      dailyRoiBps: 550,
      termDays: 7,
      promisedRoiMinor: 1_155_000n,
      activatedAt: new Date("2026-07-16T18:00:00.000Z"),
      firstSettlementDate: "2026-07-17",
      maturityDate: "2026-07-23",
      appBaseUrl: "https://uniqueskyway-v2.vercel.app",
      timeZone: "America/New_York",
    });

    expect(fields.planName).toBe("Gold Plan");
    expect(fields.principal).toBe("$30,000.00");
    expect(fields.dailyRate).toBe("5.5");
    expect(fields.dailyEarnings).toBe("$1,650.00");
    expect(fields.duration).toBe("7");
    expect(fields.expectedProfit).toBe("$11,550.00");
    expect(fields.maturityValue).toBe("$41,550.00");
    expect(fields.investmentUrl).toContain("/portfolio/inv_test_gold");
    expect(fields.schedule[0]?.label).toBe("Day 1");
    expect(fields.schedule.at(-1)?.label).toBe("Final Day");
    expect(fields.schedule.at(-1)?.amount).toBe("$1,650.00");
  });
});

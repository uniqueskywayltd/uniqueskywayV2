import { describe, expect, it } from "vitest";

import { formatTickerChange, formatTickerRate } from "@/lib/market/daily-exchange-rates";

describe("daily exchange rate presentation", () => {
  it("formats forex and large rates for the ticker", () => {
    expect(formatTickerRate("EUR/USD", 1.08523)).toBe("1.0852");
    expect(formatTickerRate("USD/JPY", 156.42)).toBe("156.42");
    expect(formatTickerRate("BTC/USD", 64250.4)).toBe("64,250");
  });

  it("formats signed day change percentages", () => {
    expect(formatTickerChange(0.125)).toBe("+0.13%");
    expect(formatTickerChange(-0.08)).toBe("-0.08%");
  });
});

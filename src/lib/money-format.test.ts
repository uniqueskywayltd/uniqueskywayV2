import { describe, expect, it } from "vitest";

import {
  caretIndexAfterDigits,
  countDigitsBefore,
  formatCryptoAmount,
  formatMoneyFieldValue,
  formatMoneyInputDisplay,
  formatMoneyMajor,
  formatMoneyMinorUnits,
  formatUsdFromMinor,
  isMoneyMinorFieldKey,
  parseMoneyInputToMinor,
  parsePositiveMoneyInputToMinor,
} from "./money-format";

describe("formatMoneyMinorUnits", () => {
  it("formats USD cents with grouping and two decimals", () => {
    expect(formatMoneyMinorUnits("en", 1000)).toBe("$10.00");
    expect(formatMoneyMinorUnits("en", 50_000_00)).toBe("$50,000.00");
    expect(formatMoneyMinorUnits("en", 5_000_000_00)).toBe("$5,000,000.00");
    expect(formatMoneyMinorUnits("en", 123_456_789)).toBe("$1,234,567.89");
  });

  it("accepts string and bigint minor units", () => {
    expect(formatUsdFromMinor("5000000")).toBe("$50,000.00");
    expect(formatUsdFromMinor(5_000_000n)).toBe("$50,000.00");
  });
});

describe("formatMoneyMajor", () => {
  it("formats major fiat amounts", () => {
    expect(formatMoneyMajor("en", 1000)).toBe("$1,000.00");
    expect(formatMoneyMajor("en", 50_000)).toBe("$50,000.00");
    expect(formatMoneyMajor("en", 5_000_000)).toBe("$5,000,000.00");
  });
});

describe("formatCryptoAmount", () => {
  it("preserves crypto precision", () => {
    expect(formatCryptoAmount(0.52345678, "BTC")).toBe("0.52345678 BTC");
    expect(formatCryptoAmount(125.5, "USDT")).toBe("125.500000 USDT");
  });
});

describe("formatMoneyInputDisplay", () => {
  it("inserts thousand separators while typing", () => {
    expect(formatMoneyInputDisplay("1000000")).toBe("1,000,000");
    expect(formatMoneyInputDisplay("50000.75")).toBe("50,000.75");
    expect(formatMoneyInputDisplay("1,000")).toBe("1,000");
  });
});

describe("parseMoneyInputToMinor", () => {
  it("parses grouped display into cents", () => {
    expect(parseMoneyInputToMinor("1,000.50")).toBe(100_050);
    expect(parsePositiveMoneyInputToMinor("50,000")).toBe(5_000_000);
    expect(parsePositiveMoneyInputToMinor("0")).toBeNull();
  });
});

describe("caret helpers", () => {
  it("keeps caret aligned to digit count", () => {
    expect(countDigitsBefore("1,000", 3)).toBe(2);
    expect(caretIndexAfterDigits("1,000", 2)).toBe(3);
  });
});

describe("formatMoneyFieldValue", () => {
  it("formats minor-unit field keys", () => {
    expect(isMoneyMinorFieldKey("amountMinor")).toBe(true);
    expect(isMoneyMinorFieldKey("totalRoiPaidMinor")).toBe(true);
    expect(formatMoneyFieldValue("amountMinor", "5000000")).toBe("$50,000.00");
    expect(formatMoneyFieldValue("email", "a@b.com")).toBe("a@b.com");
  });
});

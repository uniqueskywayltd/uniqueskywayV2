import { describe, expect, it } from "vitest";

import { coerceBigInt } from "./coerce-bigint";

describe("coerceBigInt", () => {
  it("accepts bigint, number, and numeric strings from Postgres drivers", () => {
    expect(coerceBigInt(12n)).toBe(12n);
    expect(coerceBigInt(12)).toBe(12n);
    expect(coerceBigInt("0")).toBe(0n);
    expect(coerceBigInt("5000000")).toBe(5_000_000n);
    expect(coerceBigInt(null)).toBe(0n);
  });
});

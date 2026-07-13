import { describe, expect, it } from "vitest";

import {
  DepositStateTransitionError,
  assertDepositTransition,
  canTransitionDeposit,
} from "./deposit-state-machine";

describe("deposit state machine", () => {
  it("allows the Phase 7.1 deposit lifecycle", () => {
    expect(canTransitionDeposit("created", "pending")).toBe(true);
    expect(canTransitionDeposit("pending", "confirmed")).toBe(true);
    expect(canTransitionDeposit("pending", "failed")).toBe(true);
    expect(canTransitionDeposit("confirmed", "reversed")).toBe(true);
  });

  it("rejects settlement shortcuts and terminal state rewrites", () => {
    expect(() => assertDepositTransition("created", "confirmed")).toThrow(
      DepositStateTransitionError,
    );
    expect(() => assertDepositTransition("confirmed", "failed")).toThrow(
      DepositStateTransitionError,
    );
    expect(() => assertDepositTransition("failed", "pending")).toThrow(DepositStateTransitionError);
  });
});

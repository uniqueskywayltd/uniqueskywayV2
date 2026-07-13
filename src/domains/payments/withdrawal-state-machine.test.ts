import { describe, expect, it } from "vitest";

import {
  WithdrawalStateTransitionError,
  assertWithdrawalTransition,
  canTransitionWithdrawal,
} from "./withdrawal-state-machine";

describe("withdrawal state machine", () => {
  it("allows the Phase 7.2 withdrawal lifecycle", () => {
    expect(canTransitionWithdrawal("requested", "reserved")).toBe(true);
    expect(canTransitionWithdrawal("reserved", "under_review")).toBe(true);
    expect(canTransitionWithdrawal("under_review", "approved")).toBe(true);
    expect(canTransitionWithdrawal("approved", "processing")).toBe(true);
    expect(canTransitionWithdrawal("processing", "paid")).toBe(true);
    expect(canTransitionWithdrawal("under_review", "rejected")).toBe(true);
    expect(canTransitionWithdrawal("processing", "failed")).toBe(true);
    expect(canTransitionWithdrawal("reserved", "cancelled")).toBe(true);
  });

  it("rejects payout shortcuts and terminal rewrites", () => {
    expect(() => assertWithdrawalTransition("requested", "paid")).toThrow(
      WithdrawalStateTransitionError,
    );
    expect(() => assertWithdrawalTransition("approved", "paid")).toThrow(
      WithdrawalStateTransitionError,
    );
    expect(() => assertWithdrawalTransition("rejected", "paid")).toThrow(
      WithdrawalStateTransitionError,
    );
    expect(() => assertWithdrawalTransition("paid", "processing")).toThrow(
      WithdrawalStateTransitionError,
    );
  });
});

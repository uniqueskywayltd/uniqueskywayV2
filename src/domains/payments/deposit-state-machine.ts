import type { DepositStatus } from "./entities";

export class DepositStateTransitionError extends Error {
  constructor(
    message: string,
    readonly details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = "DepositStateTransitionError";
  }
}

const allowedTransitions: Readonly<Record<DepositStatus, readonly DepositStatus[]>> = {
  created: ["pending", "failed", "cancelled"],
  pending: ["confirmed", "failed", "cancelled"],
  confirmed: ["reversed"],
  failed: [],
  cancelled: [],
  reversed: [],
};

export function canTransitionDeposit(from: DepositStatus, to: DepositStatus): boolean {
  return from === to || allowedTransitions[from].includes(to);
}

export function assertDepositTransition(from: DepositStatus, to: DepositStatus): void {
  if (!canTransitionDeposit(from, to)) {
    throw new DepositStateTransitionError("Invalid deposit status transition.", {
      from,
      to,
    });
  }
}

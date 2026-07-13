import type { WithdrawalStatus } from "./entities";

export class WithdrawalStateTransitionError extends Error {
  constructor(
    message: string,
    readonly details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = "WithdrawalStateTransitionError";
  }
}

const allowedTransitions: Readonly<Record<WithdrawalStatus, readonly WithdrawalStatus[]>> = {
  requested: ["reserved"],
  reserved: ["under_review", "approved", "cancelled"],
  under_review: ["approved", "rejected"],
  approved: ["processing"],
  processing: ["paid", "failed"],
  paid: [],
  rejected: [],
  failed: [],
  cancelled: [],
};

export function canTransitionWithdrawal(from: WithdrawalStatus, to: WithdrawalStatus): boolean {
  return from === to || allowedTransitions[from].includes(to);
}

export function assertWithdrawalTransition(from: WithdrawalStatus, to: WithdrawalStatus): void {
  if (!canTransitionWithdrawal(from, to)) {
    throw new WithdrawalStateTransitionError("Invalid withdrawal status transition.", {
      from,
      to,
    });
  }
}

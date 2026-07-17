import type { StatusTone } from "@/components/ui/status-chip";

type Translate = (key: string, values?: Record<string, string | number>) => string;

type StatusPresentation = {
  label: string;
  tone: StatusTone;
  explanation: string;
  nextExpectedStep: string;
};

const DEPOSIT_STATUS: Record<
  string,
  { labelKey: string; tone: StatusTone; explanationKey: string; nextKey: string }
> = {
  created: {
    labelKey: "status.deposit.created.label",
    tone: "pending",
    explanationKey: "status.deposit.created.explanation",
    nextKey: "status.deposit.created.next",
  },
  pending: {
    labelKey: "status.deposit.pending.label",
    tone: "pending",
    explanationKey: "status.deposit.pending.explanation",
    nextKey: "status.deposit.pending.next",
  },
  confirmed: {
    labelKey: "status.deposit.confirmed.label",
    tone: "matured",
    explanationKey: "status.deposit.confirmed.explanation",
    nextKey: "status.deposit.confirmed.next",
  },
  failed: {
    labelKey: "status.deposit.failed.label",
    tone: "restricted",
    explanationKey: "status.deposit.failed.explanation",
    nextKey: "status.deposit.failed.next",
  },
  cancelled: {
    labelKey: "status.deposit.cancelled",
    tone: "neutral",
    explanationKey: "status.deposit.cancelled.explanation",
    nextKey: "status.deposit.cancelled.next",
  },
  reversed: {
    labelKey: "status.deposit.reversed.label",
    tone: "restricted",
    explanationKey: "status.deposit.reversed.explanation",
    nextKey: "status.deposit.reversed.next",
  },
};

const WITHDRAWAL_STATUS: Record<
  string,
  { labelKey: string; tone: StatusTone; explanationKey: string; nextKey: string }
> = {
  requested: {
    labelKey: "status.withdrawal.requested.label",
    tone: "pending",
    explanationKey: "status.withdrawal.requested.explanation",
    nextKey: "status.withdrawal.requested.next",
  },
  reserved: {
    labelKey: "status.withdrawal.reserved.label",
    tone: "pending",
    explanationKey: "status.withdrawal.reserved.explanation",
    nextKey: "status.withdrawal.reserved.next",
  },
  under_review: {
    labelKey: "status.withdrawal.under_review.label",
    tone: "pending",
    explanationKey: "status.withdrawal.under_review.explanation",
    nextKey: "status.withdrawal.under_review.next",
  },
  approved: {
    labelKey: "status.withdrawal.approved",
    tone: "active",
    explanationKey: "status.withdrawal.approved.explanation",
    nextKey: "status.withdrawal.approved.next",
  },
  processing: {
    labelKey: "status.withdrawal.processing.label",
    tone: "pending",
    explanationKey: "status.withdrawal.processing.explanation",
    nextKey: "status.withdrawal.processing.next",
  },
  paid: {
    labelKey: "status.withdrawal.paid.label",
    tone: "matured",
    explanationKey: "status.withdrawal.paid.explanation",
    nextKey: "status.withdrawal.paid.next",
  },
  rejected: {
    labelKey: "status.withdrawal.rejected",
    tone: "restricted",
    explanationKey: "status.withdrawal.rejected.explanation",
    nextKey: "status.withdrawal.rejected.next",
  },
  failed: {
    labelKey: "ui.failed",
    tone: "restricted",
    explanationKey: "status.withdrawal.failed.explanation",
    nextKey: "status.withdrawal.failed.next",
  },
  cancelled: {
    labelKey: "ui.cancelled",
    tone: "neutral",
    explanationKey: "status.withdrawal.cancelled.explanation",
    nextKey: "status.withdrawal.cancelled.next",
  },
};

function resolveStatus(
  map: Record<
    string,
    { labelKey: string; tone: StatusTone; explanationKey: string; nextKey: string }
  >,
  status: string,
  t: Translate,
  fallbackExplanationKey: string,
  fallbackNextKey: string,
): StatusPresentation {
  const entry = map[status];
  if (!entry) {
    return {
      label: status,
      tone: "neutral",
      explanation: t(fallbackExplanationKey),
      nextExpectedStep: t(fallbackNextKey),
    };
  }
  return {
    label: t(entry.labelKey),
    tone: entry.tone,
    explanation: t(entry.explanationKey),
    nextExpectedStep: t(entry.nextKey),
  };
}

export function presentDepositStatus(status: string, t: Translate): StatusPresentation {
  return resolveStatus(
    DEPOSIT_STATUS,
    status,
    t,
    "status.deposit.fallback.explanation",
    "status.deposit.fallback.next",
  );
}

export function presentWithdrawalStatus(status: string, t: Translate): StatusPresentation {
  return resolveStatus(
    WITHDRAWAL_STATUS,
    status,
    t,
    "status.withdrawal.fallback.explanation",
    "status.withdrawal.fallback.next",
  );
}

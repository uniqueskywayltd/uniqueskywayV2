import type { StatusTone } from "@/components/ui/status-chip";

const DEPOSIT_STATUS: Record<
  string,
  { label: string; tone: StatusTone; explanation: string; nextExpectedStep: string }
> = {
  created: {
    label: "Deposit created",
    tone: "pending",
    explanation: "We recorded your deposit intent.",
    nextExpectedStep: "Complete payment / provider step if prompted.",
  },
  pending: {
    label: "Awaiting confirmation",
    tone: "pending",
    explanation: "Payment is submitted and waiting for confirmation or review.",
    nextExpectedStep: "Wait for provider/admin confirmation; check back for status.",
  },
  confirmed: {
    label: "Available",
    tone: "matured",
    explanation: "Funds were confirmed and credited per ledger rules.",
    nextExpectedStep: "Use funds in wallet / invest.",
  },
  failed: {
    label: "Failed",
    tone: "restricted",
    explanation: "The deposit could not complete.",
    nextExpectedStep: "Retry with a new deposit or contact support.",
  },
  cancelled: {
    label: "Cancelled",
    tone: "neutral",
    explanation: "This deposit was cancelled.",
    nextExpectedStep: "Start a new deposit if needed.",
  },
  reversed: {
    label: "Reversed",
    tone: "restricted",
    explanation: "A confirmed deposit was reversed under platform rules.",
    nextExpectedStep: "Review wallet activity; contact support if unclear.",
  },
};

const WITHDRAWAL_STATUS: Record<
  string,
  { label: string; tone: StatusTone; explanation: string; nextExpectedStep: string }
> = {
  requested: {
    label: "Awaiting Review",
    tone: "pending",
    explanation: "Your withdrawal request was received and is waiting for review.",
    nextExpectedStep: "Finance will review your request.",
  },
  reserved: {
    label: "Funds reserved",
    tone: "pending",
    explanation: "Amount is reserved so it cannot be spent twice.",
    nextExpectedStep: "Review or approval.",
  },
  under_review: {
    label: "Pending Review",
    tone: "pending",
    explanation: "A reviewer is checking this request.",
    nextExpectedStep: "Wait for approve or reject.",
  },
  approved: {
    label: "Approved",
    tone: "active",
    explanation: "The request cleared review.",
    nextExpectedStep: "Provider payout processing.",
  },
  processing: {
    label: "Processing",
    tone: "pending",
    explanation: "Payout is being sent through the payment provider.",
    nextExpectedStep: "Wait for paid or failure update.",
  },
  paid: {
    label: "Completed",
    tone: "matured",
    explanation: "The withdrawal completed successfully.",
    nextExpectedStep: "Confirm receipt in your destination.",
  },
  rejected: {
    label: "Rejected",
    tone: "restricted",
    explanation: "The request was not approved.",
    nextExpectedStep: "Read reason if shown; adjust and retry or contact support.",
  },
  failed: {
    label: "Failed",
    tone: "restricted",
    explanation: "Processing failed after approval.",
    nextExpectedStep: "Support/recovery path; do not assume silent retry.",
  },
  cancelled: {
    label: "Cancelled",
    tone: "neutral",
    explanation: "The withdrawal was cancelled.",
    nextExpectedStep: "Request again if still eligible.",
  },
};

export function presentDepositStatus(status: string) {
  return (
    DEPOSIT_STATUS[status] ?? {
      label: status,
      tone: "neutral" as const,
      explanation: "Status from the certified deposit engine.",
      nextExpectedStep: "Check back or contact support.",
    }
  );
}

export function presentWithdrawalStatus(status: string) {
  return (
    WITHDRAWAL_STATUS[status] ?? {
      label: status,
      tone: "neutral" as const,
      explanation: "Status from the certified withdrawal engine.",
      nextExpectedStep: "Check back or contact support.",
    }
  );
}

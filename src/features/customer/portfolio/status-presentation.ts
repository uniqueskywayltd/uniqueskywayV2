import type { StatusTone } from "@/components/ui/status-chip";

const INVESTMENT_STATUS_PRESENTATION: Record<
  string,
  { label: string; tone: StatusTone; explanation: string }
> = {
  pending: {
    label: "Activating",
    tone: "pending",
    explanation: "Your investment is being activated.",
  },
  active: {
    label: "Active",
    tone: "active",
    explanation: "The investment is running under certified plan terms.",
  },
  maturing: {
    label: "Maturing",
    tone: "pending",
    explanation: "Approaching end of term.",
  },
  matured: {
    label: "Matured",
    tone: "matured",
    explanation: "Term completed under plan rules.",
  },
  cancelled: {
    label: "Cancelled",
    tone: "neutral",
    explanation: "This investment was cancelled.",
  },
  failed: {
    label: "Failed",
    tone: "restricted",
    explanation: "Activation or lifecycle failed.",
  },
};

const SCHEDULE_STATUS_PRESENTATION: Record<
  string,
  { label: string; tone: StatusTone }
> = {
  scheduled: { label: "Scheduled", tone: "pending" },
  posted: { label: "Credited", tone: "matured" },
  skipped: { label: "Skipped", tone: "neutral" },
  failed: { label: "Failed", tone: "restricted" },
};

export function presentInvestmentStatus(status: string) {
  return (
    INVESTMENT_STATUS_PRESENTATION[status] ?? {
      label: status,
      tone: "neutral" as const,
      explanation: "Status from the certified investment engine.",
    }
  );
}

export function presentScheduleStatus(status: string) {
  return (
    SCHEDULE_STATUS_PRESENTATION[status] ?? {
      label: status,
      tone: "neutral" as const,
    }
  );
}

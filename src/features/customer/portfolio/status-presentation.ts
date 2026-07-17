import type { StatusTone } from "@/components/ui/status-chip";

type Translate = (key: string, values?: Record<string, string | number>) => string;

const INVESTMENT_STATUS_KEYS: Record<
  string,
  { labelKey: string; tone: StatusTone; explanationKey: string }
> = {
  pending: {
    labelKey: "status.investment.pending",
    tone: "pending",
    explanationKey: "status.investment.explanation.pending",
  },
  active: {
    labelKey: "status.investment.active",
    tone: "active",
    explanationKey: "status.investment.explanation.active",
  },
  maturing: {
    labelKey: "status.investment.maturing",
    tone: "pending",
    explanationKey: "status.investment.explanation.maturing",
  },
  matured: {
    labelKey: "status.investment.matured",
    tone: "matured",
    explanationKey: "status.investment.explanation.matured",
  },
  cancelled: {
    labelKey: "status.investment.cancelled",
    tone: "neutral",
    explanationKey: "status.investment.explanation.cancelled",
  },
  failed: {
    labelKey: "status.investment.failed",
    tone: "restricted",
    explanationKey: "status.investment.explanation.failed",
  },
};

const SCHEDULE_STATUS_KEYS: Record<string, { labelKey: string; tone: StatusTone }> = {
  scheduled: { labelKey: "status.schedule.scheduled", tone: "pending" },
  posted: { labelKey: "status.schedule.posted", tone: "matured" },
  skipped: { labelKey: "status.schedule.skipped", tone: "neutral" },
  failed: { labelKey: "status.schedule.failed", tone: "restricted" },
};

export function presentInvestmentStatus(status: string, t: Translate) {
  const config = INVESTMENT_STATUS_KEYS[status];
  if (!config) {
    return {
      label: status,
      tone: "neutral" as const,
      explanation: t("status.investment.explanation.fallback"),
    };
  }
  return {
    label: t(config.labelKey),
    tone: config.tone,
    explanation: t(config.explanationKey),
  };
}

export function presentScheduleStatus(status: string, t: Translate) {
  const config = SCHEDULE_STATUS_KEYS[status];
  if (!config) {
    return {
      label: status,
      tone: "neutral" as const,
    };
  }
  return {
    label: t(config.labelKey),
    tone: config.tone,
  };
}

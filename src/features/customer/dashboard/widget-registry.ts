/**
 * Dashboard widget composition registry — Wave B financial home (`DEC-0033`,
 * `FINANCIAL_DASHBOARD_PRINCIPLES.md`). Data binds via certified customer reads.
 */

export type DashboardWidgetId =
  | "portfolio-value"
  | "available-balance"
  | "todays-activity"
  | "pending-actions"
  | "investment-progress"
  | "notifications"
  | "next-settlement"
  | "money-timeline"
  | "whats-new"
  | "quick-actions";

export type DashboardWidgetDefinition = {
  id: DashboardWidgetId;
  title: string;
  primaryQuestion: string;
  /** Financial Home Hierarchy rank (1 = first). Null = secondary/supporting. */
  hierarchyRank: number | null;
  /** Future: user can reorder within personalization; B1 keeps default order only. */
  personalizable: boolean;
  emptyTitle: string;
  emptyDescription: string;
};

/**
 * Default composition order — Portfolio Value first (`DEC-0033`).
 */
export const DEFAULT_DASHBOARD_WIDGETS: readonly DashboardWidgetDefinition[] = [
  {
    id: "portfolio-value",
    title: "Current investment value",
    primaryQuestion: "What is my investment worth right now?",
    hierarchyRank: 1,
    personalizable: true,
    emptyTitle: "No investment value yet",
    emptyDescription:
      "When a deposit is approved, your investment starts automatically and figures appear here.",
  },
  {
    id: "available-balance",
    title: "Available cash",
    primaryQuestion: "How much cash can I use?",
    hierarchyRank: 2,
    personalizable: true,
    emptyTitle: "Available cash",
    emptyDescription: "Fund your wallet to see your available cash from the ledger.",
  },
  {
    id: "todays-activity",
    title: "Today’s activity",
    primaryQuestion: "What happened financially today?",
    hierarchyRank: 3,
    personalizable: true,
    emptyTitle: "No activity today",
    emptyDescription: "Credits and money events posted today will show here.",
  },
  {
    id: "pending-actions",
    title: "Pending actions",
    primaryQuestion: "Do I need to do anything?",
    hierarchyRank: 4,
    personalizable: true,
    emptyTitle: "Nothing needs your attention",
    emptyDescription: "Pending deposits, withdrawals, or verification tasks will appear here.",
  },
  {
    id: "investment-progress",
    title: "Investment progress",
    primaryQuestion: "How are my investments progressing?",
    hierarchyRank: 5,
    personalizable: true,
    emptyTitle: "No investments yet",
    emptyDescription: "Active investments will show calm progress toward maturity here.",
  },
  {
    id: "notifications",
    title: "Notifications",
    primaryQuestion: "What do I need to know right now?",
    hierarchyRank: 6,
    personalizable: true,
    emptyTitle: "You’re all caught up",
    emptyDescription: "Security and money alerts will show here when they occur.",
  },
  {
    id: "next-settlement",
    title: "Next settlement",
    primaryQuestion: "When is the next New York settlement cue?",
    hierarchyRank: null,
    personalizable: true,
    emptyTitle: "No settlement cue yet",
    emptyDescription:
      "When you have active investments, the next New York day settlement cue will appear here.",
  },
  {
    id: "money-timeline",
    title: "Money timeline",
    primaryQuestion: "What happened to my money, in order?",
    hierarchyRank: null,
    personalizable: true,
    emptyTitle: "No money events yet",
    emptyDescription:
      "Deposits, investments, credits, and withdrawals will form one chronological timeline.",
  },
  {
    id: "whats-new",
    title: "What’s new",
    primaryQuestion: "Did the platform improve recently?",
    hierarchyRank: null,
    personalizable: false,
    emptyTitle: "No updates right now",
    emptyDescription: "Subtle product improvements live in What’s New after releases.",
  },
  {
    id: "quick-actions",
    title: "Quick actions",
    primaryQuestion: "What can I do next?",
    hierarchyRank: null,
    personalizable: false,
    emptyTitle: "Quick actions",
    emptyDescription: "Add funds and withdraw from your wallet operations center.",
  },
] as const;

export type DashboardPersonalizationState = {
  /** Ordered widget ids. B1 ships default only — settings UI deferred. */
  widgetOrder: DashboardWidgetId[];
  hiddenWidgetIds: DashboardWidgetId[];
};

export function createDefaultDashboardPersonalization(): DashboardPersonalizationState {
  return {
    widgetOrder: DEFAULT_DASHBOARD_WIDGETS.map((widget) => widget.id),
    hiddenWidgetIds: [],
  };
}

export function resolveDashboardWidgets(
  personalization: DashboardPersonalizationState = createDefaultDashboardPersonalization(),
): DashboardWidgetDefinition[] {
  const byId = new Map(DEFAULT_DASHBOARD_WIDGETS.map((widget) => [widget.id, widget]));
  const hidden = new Set(personalization.hiddenWidgetIds);

  const resolved: DashboardWidgetDefinition[] = [];
  for (const id of personalization.widgetOrder) {
    const widget = byId.get(id);
    if (!widget || hidden.has(id)) {
      continue;
    }
    resolved.push(widget);
  }
  return resolved;
}

export type PortfolioInvestmentCard = {
  id: string;
  planName: string;
  currency: string;
  principalMinor: string;
  postedRoiMinor: string;
  termDays: number;
  status: string;
  startAt: string | null;
  firstSettlementDate: string | null;
  maturityDate: string | null;
  activatedAt: string | null;
  maturedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  progressPercent: number | null;
  nextMilestone: { label: string; date: string | null };
};

export type PortfolioSummary = {
  totalCount: number;
  byStatus: Record<string, number>;
  activePrincipalMinor: string;
};

export type PortfolioListResponse = {
  summary: PortfolioSummary;
  investments: PortfolioInvestmentCard[];
};

export type PortfolioDetailResponse = {
  investment: PortfolioInvestmentCard;
  schedule: Array<{
    id: string;
    sequenceNumber: number;
    earningDate: string;
    settlementDate: string;
    expectedRoiMicroMinor: string;
    status: string;
    postedAt: string | null;
  }>;
  lifecycle: Array<{
    key: string;
    label: string;
    at: string | null;
    complete: boolean;
  }>;
};

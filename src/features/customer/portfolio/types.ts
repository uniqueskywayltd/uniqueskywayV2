export type PortfolioInvestmentCard = {
  id: string;
  planName: string;
  currency: string;
  principalMinor: string;
  postedRoiMinor: string;
  promisedRoiMinor?: string | null;
  dailyRoiBps?: number;
  dailyRoiMinor?: string;
  totalRoiBps?: number | null;
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
  earlyExitPolicy?: string;
  earlyExitPenaltyBps?: number;
  canStop?: boolean;
  nextSettlementCountdownSeconds?: number | null;
  expectedTotalReturnMinor?: string | null;
  live?: {
    visualOnly: true;
    todayEarningsMinor: string;
    totalLiveEarningsMinor: string;
    currentValueMinor: string;
    unpostedAccruedMinor: string;
    elapsedSeconds: number;
  } | null;
};

export type PortfolioSummary = {
  totalCount: number;
  byStatus: Record<string, number>;
  activePrincipalMinor: string;
  currency?: string;
  availableBalanceMinor?: string;
  lockedBalanceMinor?: string;
  pendingBalanceMinor?: string;
  portfolioValueMinor?: string;
  totalPrincipalMinor?: string;
  totalRoiMinor?: string;
  todayEarningsMinor?: string;
  totalEarningsMinor?: string;
  currentInvestmentValueMinor?: string;
  positionsCount?: number;
  openWithdrawals?: number;
  pendingDeposits?: number;
  nextSettlementCountdownSeconds?: number;
};

export type PortfolioListResponse = {
  summary: PortfolioSummary;
  investments: PortfolioInvestmentCard[];
};

export type StopPreview = {
  canStop: boolean;
  earlyExitPolicy: string;
  principalMinor: string;
  accruedRoiMinor: string;
  postedRoiMinor: string;
  penaltyBps: number;
  penaltyMinor: string;
  creditRoiMinor: string;
  finalAmountMinor: string;
  currency: string;
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
  stopPreview?: StopPreview | null;
};

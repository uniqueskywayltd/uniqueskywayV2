export interface WalletBalances {
  currency: string;
  availableBalanceMinor: string;
  pendingBalanceMinor: string;
  lockedBalanceMinor: string;
  reservedBalanceMinor: string;
  withdrawnBalanceMinor: string;
  withdrawableBalanceMinor: string;
  lastEntryAt: string | null;
}

export interface MoneyTimelineItem {
  id: string;
  kind: "deposit" | "withdrawal" | "credit";
  title: string;
  amountMinor: string;
  currency: string;
  status: string;
  at: string;
  href: string;
}

export interface WalletDeposit {
  id: string;
  provider: string;
  currency: string;
  amountMinor: string;
  status: string;
  providerAuthorizationUrl: string | null;
  createdAt: string;
  confirmedAt: string | null;
  updatedAt: string;
}

export interface WalletWithdrawal {
  id: string;
  currency: string;
  amountMinor: string;
  destinationType: string;
  destinationReference: string;
  status: string;
  reviewReason: string | null;
  createdAt: string;
  paidAt: string | null;
  updatedAt: string;
}

export interface WalletOverviewResponse {
  balances: WalletBalances;
  vocabulary: Array<{
    id: string;
    label: string;
    customerWording: string;
    source: string;
  }>;
  recentActivity: MoneyTimelineItem[];
  recentDeposits: WalletDeposit[];
  recentWithdrawals: WalletWithdrawal[];
  pendingDepositCount: number;
  openWithdrawalCount: number;
}

export interface LedgerEntryRow {
  id: string;
  transactionType: string;
  label: string;
  referenceType: string;
  referenceId: string;
  description: string | null;
  amountMinor: string;
  direction: "debit" | "credit";
  currency: string;
  walletCategory: string;
  postedAt: string;
  href: string | null;
}

export interface TimelineStep {
  key: string;
  label: string;
  complete: boolean;
  current: boolean;
  at: string | null;
  nextExpectedStep: string;
}

export type StatementType = "monthly" | "wallet" | "investment";

export interface StatementListItem {
  id: string;
  type: StatementType;
  typeLabel: string;
  periodKey: string;
  periodLabel: string;
  periodBounds: string;
  timezone: string;
  status: "ready";
  statusLabel: string;
  lineCount: number;
  creditTotalMinor: string;
  debitTotalMinor: string;
  projectedAt: string;
  href: string;
}

export interface StatementDownloadRow {
  id: string;
  statementId: string;
  downloadedAt: string;
  type: string | null;
  periodKey: string | null;
}

export interface StatementListResponse {
  timezone: string;
  projectedAt: string;
  scanLimit: number;
  understanding: string;
  statements: StatementListItem[];
  downloads: StatementDownloadRow[];
  emptyHint: string | null;
}

export interface StatementLine {
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

export interface StatementDetail {
  id: string;
  type: StatementType;
  typeLabel: string;
  periodKey: string;
  periodLabel: string;
  periodBounds: string;
  timezone: string;
  status: "ready";
  statusLabel: string;
  projectedAt: string;
  understanding: string;
  footer: string;
  summary: {
    creditTotalMinor: string;
    debitTotalMinor: string;
    periodNetMinor: string;
    note: string;
  };
  categoryTotals: Array<{
    category: string;
    creditTotalMinor: string;
    debitTotalMinor: string;
  }>;
  lineCount: number;
  lines: StatementLine[];
  currency: string;
  related: {
    ledgerHref: string;
    walletHref: string;
    portfolioHref: string;
    successHref: string;
  };
}

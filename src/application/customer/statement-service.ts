import "server-only";

import { AppError } from "@/application/errors";
import type { IdentityProvider } from "@/application/auth";
import { FINANCIAL_TIME_ZONE } from "@/config/constants";
import { toNewYorkDate } from "@/domains/settlement/new-york-calendar";
import type {
  DrizzleTransactionManager,
  IdentityRepository,
  LedgerRepository,
  OperationsRepository,
  WalletLedgerEventRecord,
} from "@/infrastructure/database";

import {
  serializeLedgerEvent,
} from "./wallet-service";
import type { RequestAuditContext } from "./customer-experience-service";

const DEFAULT_CURRENCY = "USD";
const LEDGER_SCAN_LIMIT = 200;

export type StatementType = "monthly" | "wallet" | "investment";

export interface CustomerStatementServiceDependencies {
  identityProvider: IdentityProvider;
  identityRepository: IdentityRepository;
  ledgerRepository: LedgerRepository;
  operationsRepository: OperationsRepository;
  transactionManager: DrizzleTransactionManager;
}

const STATEMENT_TYPES: StatementType[] = ["monthly", "wallet", "investment"];

const TYPE_LABELS: Record<StatementType, string> = {
  monthly: "Monthly activity statement",
  wallet: "Wallet summary",
  investment: "Investment summary",
};

const STATEMENT_FOOTER =
  "Unique Sky Way statements project posted ledger activity for the stated period. They are not tax advice. Accrued earnings that are not yet credited are not included unless explicitly labeled. For personal tax questions, consult a qualified professional.";

export class CustomerStatementService {
  constructor(private readonly deps: CustomerStatementServiceDependencies) {}

  async listStatements(input: {
    type?: StatementType | "all";
    q?: string;
  } = {}) {
    const appUser = await this.requireCurrentAppUser();
    const events = await this.deps.ledgerRepository.listWalletLedgerEvents(
      appUser.id,
      DEFAULT_CURRENCY,
      LEDGER_SCAN_LIMIT,
    );
    const projectedAt = new Date().toISOString();
    let statements = buildStatementList(events, projectedAt);

    const typeFilter = input.type && input.type !== "all" ? input.type : null;
    if (typeFilter) {
      statements = statements.filter((row) => row.type === typeFilter);
    }

    const q = input.q?.trim().toLowerCase();
    if (q) {
      statements = statements.filter(
        (row) =>
          row.periodLabel.toLowerCase().includes(q) ||
          row.periodKey.includes(q) ||
          row.typeLabel.toLowerCase().includes(q) ||
          row.id.toLowerCase().includes(q),
      );
    }

    const downloads = await this.listDownloadHistory(appUser.id);

    return {
      timezone: FINANCIAL_TIME_ZONE,
      projectedAt,
      scanLimit: LEDGER_SCAN_LIMIT,
      understanding:
        "These statements help you understand your financial history. Totals are summed from certified ledger postings for each New York calendar month.",
      statements,
      downloads,
      emptyHint:
        statements.length === 0
          ? "No posted activity to statement yet. When deposits, ROI, or withdrawals post, months appear here."
          : null,
    };
  }

  async getStatement(statementId: string) {
    const appUser = await this.requireCurrentAppUser();
    const parsed = parseStatementId(statementId);
    if (!parsed) {
      throw new AppError({ code: "NOT_FOUND", message: "Statement was not found." });
    }

    const events = await this.deps.ledgerRepository.listWalletLedgerEvents(
      appUser.id,
      DEFAULT_CURRENCY,
      LEDGER_SCAN_LIMIT,
    );
    const projectedAt = new Date().toISOString();
    const detail = buildStatementDetail(events, parsed.type, parsed.periodKey, projectedAt);

    if (!detail) {
      throw new AppError({ code: "NOT_FOUND", message: "Statement was not found." });
    }

    return detail;
  }

  async recordDownload(statementId: string, audit: RequestAuditContext) {
    const appUser = await this.requireCurrentAppUser();
    const detail = await this.getStatement(statementId);

    await this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.deps.operationsRepository.appendAuditLog(tx, {
        actorUserId: appUser.id,
        actorType: "customer",
        action: "customer.statement_downloaded",
        targetType: "customer_statement",
        targetId: statementId,
        metadata: {
          type: detail.type,
          periodKey: detail.periodKey,
          lineCount: detail.lineCount,
          creditTotalMinor: detail.summary.creditTotalMinor,
          debitTotalMinor: detail.summary.debitTotalMinor,
        },
        requestId: audit.requestId,
        ipAddressHash: audit.ipAddressHash,
        userAgentHash: audit.userAgentHash,
      });
    });

    return {
      recorded: true,
      statementId,
      downloadedAt: new Date().toISOString(),
    };
  }

  private async listDownloadHistory(userId: string) {
    const logs = await this.deps.operationsRepository.listAuditLogsByActorUserId(userId, 40);
    return logs
      .filter(
        (row) =>
          row.action === "customer.statement_downloaded" &&
          row.targetType === "customer_statement",
      )
      .slice(0, 20)
      .map((row) => ({
        id: row.id,
        statementId: row.targetId,
        downloadedAt: row.createdAt.toISOString(),
        type: typeof row.metadata?.type === "string" ? row.metadata.type : null,
        periodKey: typeof row.metadata?.periodKey === "string" ? row.metadata.periodKey : null,
      }));
  }

  private async requireCurrentAppUser() {
    const currentUser = await this.deps.identityProvider.getCurrentUser();
    if (!currentUser) {
      throw new AppError({ code: "AUTHENTICATION_ERROR", message: "Authentication is required." });
    }
    const appUser = await this.deps.identityRepository.findUserByAuthUserId(currentUser.authUserId);
    if (!appUser) {
      throw new AppError({
        code: "AUTHENTICATION_ERROR",
        message: "Authenticated user is not registered.",
      });
    }
    return appUser;
  }
}

export function parseStatementId(
  statementId: string,
): { type: StatementType; periodKey: string } | null {
  const match = /^(monthly|wallet|investment)[-:](\d{4}-\d{2})$/.exec(statementId);
  if (!match) return null;
  return { type: match[1] as StatementType, periodKey: match[2]! };
}

export function nyPeriodKey(date: Date): string {
  return toNewYorkDate(date).slice(0, 7);
}

export function periodLabel(periodKey: string): string {
  const [year, month] = periodKey.split("-");
  const monthIndex = Number(month) - 1;
  const name = new Date(Date.UTC(Number(year), monthIndex, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return name;
}

export function periodBoundsLabel(periodKey: string): string {
  const [year, month] = periodKey.split("-").map(Number) as [number, number];
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const mm = String(month).padStart(2, "0");
  return `${year}-${mm}-01 → ${year}-${mm}-${String(lastDay).padStart(2, "0")} (NY)`;
}

export function isInvestmentLedgerEvent(event: WalletLedgerEventRecord): boolean {
  return (
    event.transactionType === "investment_funding" ||
    event.transactionType === "roi_settlement" ||
    event.transactionType === "maturity_principal_release" ||
    event.referenceType === "investment"
  );
}

export function buildStatementList(
  events: WalletLedgerEventRecord[],
  projectedAt: string,
) {
  const periods = new Set(events.map((event) => nyPeriodKey(event.postedAt)));
  const sortedPeriods = [...periods].sort((a, b) => (a < b ? 1 : -1));

  return sortedPeriods.flatMap((periodKey) => {
    const periodEvents = events.filter((event) => nyPeriodKey(event.postedAt) === periodKey);
    return STATEMENT_TYPES.map((type) => {
      const scoped = scopeEvents(periodEvents, type);
      const summary = summarizeLines(scoped);
      return {
        id: `${type}-${periodKey}`,
        type,
        typeLabel: TYPE_LABELS[type],
        periodKey,
        periodLabel: periodLabel(periodKey),
        periodBounds: periodBoundsLabel(periodKey),
        timezone: FINANCIAL_TIME_ZONE,
        status: "ready" as const,
        statusLabel: "Ready",
        lineCount: scoped.length,
        creditTotalMinor: summary.creditTotalMinor,
        debitTotalMinor: summary.debitTotalMinor,
        projectedAt,
        href: `/account/statements/${type}-${periodKey}`,
      };
    }).filter((row) => row.lineCount > 0 || row.type === "monthly");
  });
}

export function buildStatementDetail(
  events: WalletLedgerEventRecord[],
  type: StatementType,
  periodKey: string,
  projectedAt: string,
) {
  const periodEvents = events.filter((event) => nyPeriodKey(event.postedAt) === periodKey);
  if (periodEvents.length === 0 && type !== "monthly") {
    return null;
  }

  const scoped = scopeEvents(periodEvents, type);
  // monthly always exists as understanding surface even if empty for that key —
  // but we only open months that appear in list; empty investment months filtered out.
  if (type !== "monthly" && scoped.length === 0) {
    return null;
  }
  if (type === "monthly" && periodEvents.length === 0) {
    return null;
  }

  const summary = summarizeLines(scoped);
  const categoryTotals = summarizeCategories(scoped);
  const lines = scoped
    .slice()
    .sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime())
    .map((event) => serializeLedgerEvent(event));

  return {
    id: `${type}-${periodKey}`,
    type,
    typeLabel: TYPE_LABELS[type],
    periodKey,
    periodLabel: periodLabel(periodKey),
    periodBounds: periodBoundsLabel(periodKey),
    timezone: FINANCIAL_TIME_ZONE,
    status: "ready" as const,
    statusLabel: "Ready",
    projectedAt,
    understanding:
      "Totals match your ledger for this period. Period net activity is not your available balance.",
    footer: STATEMENT_FOOTER,
    summary: {
      ...summary,
      note: "Period net is credits minus debits for listed lines only — not available balance.",
    },
    categoryTotals,
    lineCount: lines.length,
    lines,
    currency: DEFAULT_CURRENCY,
    related: {
      ledgerHref: "/ledger",
      walletHref: "/wallet",
      portfolioHref: "/portfolio",
      successHref: "/account/success",
    },
  };
}

function scopeEvents(
  events: WalletLedgerEventRecord[],
  type: StatementType,
): WalletLedgerEventRecord[] {
  if (type === "investment") {
    return events.filter(isInvestmentLedgerEvent);
  }
  return events;
}

export function summarizeLines(events: WalletLedgerEventRecord[]) {
  let credit = 0n;
  let debit = 0n;
  for (const event of events) {
    if (event.direction === "credit") credit += event.amountMinor;
    else debit += event.amountMinor;
  }
  return {
    creditTotalMinor: credit.toString(),
    debitTotalMinor: debit.toString(),
    periodNetMinor: (credit - debit).toString(),
  };
}

export function summarizeCategories(events: WalletLedgerEventRecord[]) {
  const map = new Map<string, { credit: bigint; debit: bigint }>();
  for (const event of events) {
    const row = map.get(event.walletCategory) ?? { credit: 0n, debit: 0n };
    if (event.direction === "credit") row.credit += event.amountMinor;
    else row.debit += event.amountMinor;
    map.set(event.walletCategory, row);
  }
  return [...map.entries()].map(([category, totals]) => ({
    category,
    creditTotalMinor: totals.credit.toString(),
    debitTotalMinor: totals.debit.toString(),
  }));
}

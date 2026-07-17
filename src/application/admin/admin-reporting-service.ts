import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";

import ExcelJS from "exceljs";

import type { IdentityProvider } from "@/application/auth";
import { AppError } from "@/application/errors";
import type { Clock } from "@/application/ports";
import { FINANCIAL_TIME_ZONE } from "@/config/constants";
import type {
  DrizzleTransactionManager,
  IdentityRepository,
  OperationsRepository,
  ReportingRepository,
  ReportPeriodGranularity,
} from "@/infrastructure/database";

import type { RequestAuditContext } from "./admin-customer-service";
import { requireAdminActor } from "./require-admin";
import { formatMoneyFieldValue, isMoneyMinorFieldKey } from "@/lib/money-format";

const EXPORT_ROW_LIMIT = 10_000;
const PENDING_DEPOSIT_STATUSES = ["created", "pending"] as const;
const PENDING_WITHDRAWAL_STATUSES = ["under_review", "approved"] as const;

export interface AdminReportingServiceDependencies {
  identityProvider?: IdentityProvider;
  identityRepository: IdentityRepository;
  clock: Clock;
  transactionManager: DrizzleTransactionManager;
  reportingRepository: ReportingRepository;
  operationsRepository: OperationsRepository;
}

export interface ReportFilterInput {
  from?: string | undefined;
  to?: string | undefined;
  status?: string | undefined;
  customerId?: string | undefined;
  investmentId?: string | undefined;
  reference?: string | undefined;
  q?: string | undefined;
  limit?: number | undefined;
  granularity?: ReportPeriodGranularity | undefined;
}

export type ExportRow = Record<string, string | number | boolean | null>;

export class AdminReportingService {
  constructor(private readonly deps: AdminReportingServiceDependencies) {}

  async getExecutiveDashboard() {
    await requireAdminActor(this.deps, "reports.read");
    const repo = this.deps.reportingRepository;

    const [
      totalCustomers,
      verifiedCustomers,
      suspendedCustomers,
      activeInvestments,
      maturedInvestments,
    ] = await Promise.all([
      repo.countCustomerAccounts(),
      repo.countCustomerProfilesByKyc("approved"),
      repo.countCustomerAccounts("restricted"),
      repo.countInvestmentsByStatus("active"),
      repo.countInvestmentsByStatus("matured"),
    ]);

    const [
      pendingDeposits,
      pendingWithdrawals,
      totalDepositsMinor,
      totalWithdrawalsMinor,
      totalRoiPaidMinor,
    ] = await Promise.all([
      repo.countDepositsByStatuses([...PENDING_DEPOSIT_STATUSES]),
      repo.countWithdrawalsByStatuses([...PENDING_WITHDRAWAL_STATUSES]),
      repo.sumDepositAmountByStatuses(["confirmed"]),
      repo.sumWithdrawalAmountByStatuses(["paid"]),
      repo.sumPostedRoiMinor(),
    ]);

    const [failedJobs, webhookStats, databaseStatus] = await Promise.all([
      this.deps.operationsRepository.countBackgroundJobsByStatus("failed"),
      repo.webhookStats(),
      repo.probeDatabase(),
    ]);

    return {
      timezone: FINANCIAL_TIME_ZONE,
      generatedAt: this.deps.clock.now().toISOString(),
      customers: {
        total: totalCustomers,
        verified: verifiedCustomers,
        suspended: suspendedCustomers,
      },
      investments: {
        active: activeInvestments,
        matured: maturedInvestments,
      },
      moneyMovement: {
        pendingDeposits,
        pendingWithdrawals,
        totalDepositsMinor: totalDepositsMinor.toString(),
        totalWithdrawalsMinor: totalWithdrawalsMinor.toString(),
        totalRoiPaidMinor: totalRoiPaidMinor.toString(),
      },
      systemHealth: {
        databaseStatus,
        failedJobs,
        deadLetteredWebhooks: webhookStats.deadLettered,
      },
    };
  }

  async getCustomerReport(kind: string, filters: ReportFilterInput = {}) {
    await requireAdminActor(this.deps, "reports.read");
    const range = this.toDateRange(filters);

    switch (kind) {
      case "growth":
        return {
          kind,
          timezone: FINANCIAL_TIME_ZONE,
          series: await this.deps.reportingRepository.customerGrowth(range),
        };
      case "verification":
        return {
          kind,
          rows: await this.deps.reportingRepository.kycStatusDistribution(),
        };
      case "active_users":
        return {
          kind,
          activeCustomers: await this.deps.reportingRepository.countCustomerAccounts("active"),
        };
      case "login_activity":
        return {
          kind,
          ...(await this.deps.reportingRepository.loginActivity(range, filters.limit ?? 50)),
        };
      case "geography":
        return {
          kind,
          rows: await this.deps.reportingRepository.geographyDistribution(),
        };
      case "referrals":
        return {
          kind,
          ...(await this.deps.reportingRepository.referralStatusCounts()),
        };
      case "export":
        return {
          kind,
          rows: await this.deps.reportingRepository.listCustomerExportRows({
            ...range,
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.q ? { q: filters.q } : {}),
            limit: Math.min(filters.limit ?? 500, EXPORT_ROW_LIMIT),
          }),
        };
      default:
        throw new AppError({
          code: "VALIDATION_ERROR",
          message: "Unknown customer report kind.",
          details: { kind },
        });
    }
  }

  async getFinancialReport(kind: string, filters: ReportFilterInput = {}) {
    await requireAdminActor(this.deps, "reports.read");
    const range = this.toDateRange(filters);

    switch (kind) {
      case "deposits":
        return {
          kind,
          byStatus: await this.deps.reportingRepository.amountSummaryByStatus("deposits"),
        };
      case "withdrawals":
        return {
          kind,
          byStatus: await this.deps.reportingRepository.amountSummaryByStatus("withdrawals"),
        };
      case "investments":
        return {
          kind,
          byStatus: await this.deps.reportingRepository.amountSummaryByStatus("investments"),
        };
      case "settlements":
        return {
          kind,
          runs: await this.deps.reportingRepository.countByStatus("settlement_runs"),
          items: await this.deps.reportingRepository.countByStatus("settlement_items"),
        };
      case "roi":
        return {
          kind,
          totalPostedRoiMinor: (
            await this.deps.reportingRepository.sumPostedRoiMinor(range)
          ).toString(),
        };
      case "ledger":
        return {
          kind,
          ...(await this.deps.reportingRepository.ledgerSummary()),
        };
      case "period":
        return {
          kind,
          timezone: FINANCIAL_TIME_ZONE,
          granularity: filters.granularity ?? "day",
          series: await this.deps.reportingRepository.periodTotals(
            filters.granularity ?? "day",
            range,
          ),
        };
      default:
        throw new AppError({
          code: "VALIDATION_ERROR",
          message: "Unknown financial report kind.",
          details: { kind },
        });
    }
  }

  async getOperationalReport(kind: string) {
    await requireAdminActor(this.deps, "reports.read");

    switch (kind) {
      case "jobs":
        return { kind, byStatus: await this.deps.reportingRepository.jobStatusCounts() };
      case "email":
        return { kind, byStatus: await this.deps.reportingRepository.emailStatusCounts() };
      case "notifications":
        return { kind, ...(await this.deps.reportingRepository.notificationStats()) };
      case "webhooks":
        return { kind, ...(await this.deps.reportingRepository.webhookStats()) };
      case "security":
        return { kind, bySeverity: await this.deps.reportingRepository.securityEventCounts() };
      case "audit":
        return { kind, byAction: await this.deps.reportingRepository.auditActionCounts() };
      default:
        throw new AppError({
          code: "VALIDATION_ERROR",
          message: "Unknown operational report kind.",
          details: { kind },
        });
    }
  }

  async getSystemReport() {
    await requireAdminActor(this.deps, "reports.read");
    const [jobs, emails, databaseStatus] = await Promise.all([
      this.deps.reportingRepository.jobStatusCounts(),
      this.deps.reportingRepository.emailStatusCounts(),
      this.deps.reportingRepository.probeDatabase(),
    ]);

    return {
      version: readPackageVersion(),
      gitCommit: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT ?? "unknown",
      releaseTag: process.env.VERCEL_GIT_COMMIT_REF ?? process.env.RELEASE_TAG ?? "unknown",
      environment: process.env.NODE_ENV ?? "unknown",
      timezone: FINANCIAL_TIME_ZONE,
      databaseStatus,
      schedulerStatus: jobs,
      emailStatus: emails,
      storageStatus: "unknown" as const,
      generatedAt: this.deps.clock.now().toISOString(),
    };
  }

  async exportReport(
    input: {
      reportKey: string;
      format: "csv" | "xlsx";
      filters?: ReportFilterInput | undefined;
    },
    context: RequestAuditContext,
  ) {
    const admin = await requireAdminActor(this.deps, "reports.export");
    const filters = input.filters ?? {};
    const { rows, truncated } = await this.buildExportRows(input.reportKey, filters);
    const generatedAt = this.deps.clock.now();

    await this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.deps.operationsRepository.appendAuditLog(tx, {
        actorUserId: admin.appUser.id,
        actorType: "admin",
        action: "report.exported",
        targetType: "report",
        targetId: input.reportKey,
        reason: null,
        metadata: {
          permissionUsed: admin.permissionUsed,
          reportKey: input.reportKey,
          format: input.format,
          filters,
          rowCount: rows.length,
          truncated,
        },
        requestId: context.requestId,
        ipAddressHash: context.ipAddressHash,
        userAgentHash: context.userAgentHash,
      });
    });

    if (input.format === "csv") {
      return {
        contentType: "text/csv; charset=utf-8",
        filename: `${sanitizeFilename(input.reportKey)}-${toNyDate(generatedAt)}.csv`,
        body: rowsToCsv(rows),
        truncated,
        rowCount: rows.length,
      };
    }

    return {
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: `${sanitizeFilename(input.reportKey)}-${toNyDate(generatedAt)}.xlsx`,
      body: await rowsToXlsx(rows, input.reportKey),
      truncated,
      rowCount: rows.length,
    };
  }

  private async buildExportRows(reportKey: string, filters: ReportFilterInput) {
    const [domain, kind] = reportKey.split(".");
    if (!domain || !kind) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "reportKey must be in the form domain.kind (for example financial.deposits).",
      });
    }

    let payload: unknown;
    if (domain === "executive" && kind === "dashboard") {
      payload = await this.getExecutiveDashboard();
    } else if (domain === "customers") {
      payload = await this.getCustomerReport(kind, filters);
    } else if (domain === "financial") {
      payload = await this.getFinancialReport(kind, filters);
    } else if (domain === "operational") {
      payload = await this.getOperationalReport(kind);
    } else if (domain === "system" && kind === "info") {
      payload = await this.getSystemReport();
    } else {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Unknown report key.",
        details: { reportKey },
      });
    }

    const flat = flattenReportRows(payload);
    const truncated = flat.length > EXPORT_ROW_LIMIT;
    return {
      rows: flat.slice(0, EXPORT_ROW_LIMIT),
      truncated,
    };
  }

  private toDateRange(filters: ReportFilterInput) {
    const range: { from?: Date; to?: Date } = {};
    if (filters.from) {
      const from = parseNyBoundary(filters.from, "start");
      if (Number.isNaN(from.getTime())) {
        throw new AppError({ code: "VALIDATION_ERROR", message: "Invalid from date." });
      }
      range.from = from;
    }
    if (filters.to) {
      const to = parseNyBoundary(filters.to, "end");
      if (Number.isNaN(to.getTime())) {
        throw new AppError({ code: "VALIDATION_ERROR", message: "Invalid to date." });
      }
      range.to = to;
    }
    return range;
  }
}

function parseNyBoundary(date: string, edge: "start" | "end"): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Date(Number.NaN);
  }
  // Cover both EST (-05:00) and EDT (-04:00) by using inclusive outer bounds.
  return edge === "start"
    ? new Date(`${date}T00:00:00.000-05:00`)
    : new Date(`${date}T23:59:59.999-04:00`);
}

function toNyDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FINANCIAL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function sanitizeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

function flattenReportRows(payload: unknown): ExportRow[] {
  if (!payload || typeof payload !== "object") {
    return [{ value: String(payload) }];
  }

  const record = payload as Record<string, unknown>;
  for (const key of [
    "rows",
    "series",
    "byStatus",
    "bySeverity",
    "byAction",
    "items",
    "runs",
    "referrals",
    "rewards",
    "entriesByDirection",
    "schedulerStatus",
    "emailStatus",
  ]) {
    const value = record[key];
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
      return value.map((row) => stringifyRow(row as Record<string, unknown>));
    }
  }

  if (Array.isArray(record.recentSessions)) {
    return (record.recentSessions as Array<Record<string, unknown>>).map(stringifyRow);
  }

  return [stringifyRow(record)];
}

function stringifyRow(row: Record<string, unknown>): ExportRow {
  const currency =
    typeof row.currency === "string" && row.currency.trim() ? row.currency.trim() : "USD";
  const output: ExportRow = {};
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Date) {
      output[key] = value.toISOString();
      continue;
    }
    if (isMoneyMinorFieldKey(key)) {
      output[key] = formatMoneyFieldValue(key, value, currency);
      continue;
    }
    if (typeof value === "bigint") {
      output[key] = value.toString();
      continue;
    }
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      output[key] = value;
      continue;
    }
    output[key] = JSON.stringify(value);
  }
  return output;
}

function rowsToCsv(rows: ExportRow[]): string {
  if (rows.length === 0) return "";
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const escape = (value: string | number | boolean | null) => {
    const text = value == null ? "" : String(value);
    if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
    return text;
  };
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header] ?? null)).join(",")),
  ].join("\n");
}

async function rowsToXlsx(rows: ExportRow[], sheetName: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31) || "report");
  const headers =
    rows.length > 0 ? [...new Set(rows.flatMap((row) => Object.keys(row)))] : ["empty"];
  sheet.addRow(headers);
  for (const row of rows) {
    sheet.addRow(headers.map((header) => row[header] ?? null));
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function readPackageVersion() {
  try {
    const packageJson = JSON.parse(
      readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
    ) as { version?: string };
    return packageJson.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

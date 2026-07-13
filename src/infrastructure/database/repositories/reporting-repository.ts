import { and, asc, desc, eq, gte, ilike, inArray, isNotNull, isNull, lte, or, sql } from "drizzle-orm";

import { FINANCIAL_TIME_ZONE } from "@/config/constants";

import {
  auditLogs,
  backgroundJobs,
  customerAccounts,
  customerProfiles,
  depositIntents,
  emailMessages,
  investments,
  ledgerEntries,
  ledgerTransactions,
  notificationDeliveries,
  notifications,
  paymentProviderEvents,
  referrals,
  referralRewards,
  roiLedgerEntries,
  securityEvents,
  sessions,
  settlementItems,
  settlementRuns,
  users,
  withdrawalRequests,
} from "../schema";
import type { AppDatabaseExecutor } from "../types";
import { BaseDrizzleRepository } from "./base-repository";

const nyTz = sql.raw(`'${FINANCIAL_TIME_ZONE}'`);

export type ReportPeriodGranularity = "day" | "week" | "month" | "year";

export interface ReportDateRange {
  from?: Date;
  to?: Date;
}

export interface StatusCountRow {
  status: string;
  count: number;
}

export interface AmountByStatusRow {
  status: string;
  count: number;
  amountMinor: string;
}

export interface PeriodTotalRow {
  period: string;
  depositsAmountMinor: string;
  withdrawalsAmountMinor: string;
  roiPaidMinor: string;
  depositsCount: number;
  withdrawalsCount: number;
}

export interface CustomerExportRow {
  userId: string;
  email: string;
  accountStatus: string;
  kycStatus: string;
  riskStatus: string;
  country: string | null;
  createdAt: Date;
}

export class ReportingRepository extends BaseDrizzleRepository {
  constructor(db: AppDatabaseExecutor) {
    super("reporting", db);
  }

  protected clone(db: AppDatabaseExecutor): ReportingRepository {
    return new ReportingRepository(db);
  }

  async probeDatabase(): Promise<"ok" | "error"> {
    try {
      await this.db.execute(sql`select 1`);
      return "ok";
    } catch {
      return "error";
    }
  }

  async countCustomerAccounts(status?: string): Promise<number> {
    const condition = status ? eq(customerAccounts.status, status as never) : undefined;
    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(customerAccounts)
      .where(condition);
    return rows[0]?.count ?? 0;
  }

  async countCustomerProfilesByKyc(kycStatus: string): Promise<number> {
    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(customerProfiles)
      .where(eq(customerProfiles.kycStatus, kycStatus as never));
    return rows[0]?.count ?? 0;
  }

  async countInvestmentsByStatus(status: string): Promise<number> {
    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(investments)
      .where(eq(investments.status, status as never));
    return rows[0]?.count ?? 0;
  }

  async countDepositsByStatuses(
    statuses: ReadonlyArray<"created" | "pending" | "confirmed" | "failed" | "cancelled" | "reversed">,
  ): Promise<number> {
    if (statuses.length === 0) return 0;
    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(depositIntents)
      .where(inArray(depositIntents.status, [...statuses]));
    return rows[0]?.count ?? 0;
  }

  async countWithdrawalsByStatuses(
    statuses: ReadonlyArray<
      | "requested"
      | "reserved"
      | "under_review"
      | "approved"
      | "processing"
      | "paid"
      | "rejected"
      | "failed"
      | "cancelled"
    >,
  ): Promise<number> {
    if (statuses.length === 0) return 0;
    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(withdrawalRequests)
      .where(inArray(withdrawalRequests.status, [...statuses]));
    return rows[0]?.count ?? 0;
  }

  async sumDepositAmountByStatuses(
    statuses: ReadonlyArray<"created" | "pending" | "confirmed" | "failed" | "cancelled" | "reversed">,
    range: ReportDateRange = {},
  ): Promise<bigint> {
    const conditions = [inArray(depositIntents.status, [...statuses])];
    if (range.from) conditions.push(gte(depositIntents.createdAt, range.from));
    if (range.to) conditions.push(lte(depositIntents.createdAt, range.to));
    const rows = await this.db
      .select({
        total: sql<string>`coalesce(sum(${depositIntents.amountMinor}), 0)::text`,
      })
      .from(depositIntents)
      .where(and(...conditions));
    return BigInt(rows[0]?.total ?? "0");
  }

  async sumWithdrawalAmountByStatuses(
    statuses: ReadonlyArray<
      | "requested"
      | "reserved"
      | "under_review"
      | "approved"
      | "processing"
      | "paid"
      | "rejected"
      | "failed"
      | "cancelled"
    >,
    range: ReportDateRange = {},
  ): Promise<bigint> {
    const conditions = [inArray(withdrawalRequests.status, [...statuses])];
    if (range.from) conditions.push(gte(withdrawalRequests.createdAt, range.from));
    if (range.to) conditions.push(lte(withdrawalRequests.createdAt, range.to));
    const rows = await this.db
      .select({
        total: sql<string>`coalesce(sum(${withdrawalRequests.amountMinor}), 0)::text`,
      })
      .from(withdrawalRequests)
      .where(and(...conditions));
    return BigInt(rows[0]?.total ?? "0");
  }

  async sumPostedRoiMinor(range: ReportDateRange = {}): Promise<bigint> {
    const conditions = [eq(roiLedgerEntries.status, "posted")];
    if (range.from) conditions.push(gte(roiLedgerEntries.createdAt, range.from));
    if (range.to) conditions.push(lte(roiLedgerEntries.createdAt, range.to));
    const rows = await this.db
      .select({
        total: sql<string>`coalesce(sum(${roiLedgerEntries.postedRoiMinor}), 0)::text`,
      })
      .from(roiLedgerEntries)
      .where(and(...conditions));
    return BigInt(rows[0]?.total ?? "0");
  }

  async countByStatus(
    table: "deposits" | "withdrawals" | "investments" | "settlement_runs" | "settlement_items",
  ): Promise<StatusCountRow[]> {
    if (table === "deposits") {
      return this.db
        .select({
          status: depositIntents.status,
          count: sql<number>`count(*)::int`,
        })
        .from(depositIntents)
        .groupBy(depositIntents.status)
        .orderBy(depositIntents.status);
    }
    if (table === "withdrawals") {
      return this.db
        .select({
          status: withdrawalRequests.status,
          count: sql<number>`count(*)::int`,
        })
        .from(withdrawalRequests)
        .groupBy(withdrawalRequests.status)
        .orderBy(withdrawalRequests.status);
    }
    if (table === "investments") {
      return this.db
        .select({
          status: investments.status,
          count: sql<number>`count(*)::int`,
        })
        .from(investments)
        .groupBy(investments.status)
        .orderBy(investments.status);
    }
    if (table === "settlement_runs") {
      return this.db
        .select({
          status: settlementRuns.status,
          count: sql<number>`count(*)::int`,
        })
        .from(settlementRuns)
        .groupBy(settlementRuns.status)
        .orderBy(settlementRuns.status);
    }
    return this.db
      .select({
        status: settlementItems.status,
        count: sql<number>`count(*)::int`,
      })
      .from(settlementItems)
      .groupBy(settlementItems.status)
      .orderBy(settlementItems.status);
  }

  async amountSummaryByStatus(
    table: "deposits" | "withdrawals" | "investments",
  ): Promise<AmountByStatusRow[]> {
    if (table === "deposits") {
      const rows = await this.db
        .select({
          status: depositIntents.status,
          count: sql<number>`count(*)::int`,
          amountMinor: sql<string>`coalesce(sum(${depositIntents.amountMinor}), 0)::text`,
        })
        .from(depositIntents)
        .groupBy(depositIntents.status)
        .orderBy(depositIntents.status);
      return rows;
    }
    if (table === "withdrawals") {
      return this.db
        .select({
          status: withdrawalRequests.status,
          count: sql<number>`count(*)::int`,
          amountMinor: sql<string>`coalesce(sum(${withdrawalRequests.amountMinor}), 0)::text`,
        })
        .from(withdrawalRequests)
        .groupBy(withdrawalRequests.status)
        .orderBy(withdrawalRequests.status);
    }
    return this.db
      .select({
        status: investments.status,
        count: sql<number>`count(*)::int`,
        amountMinor: sql<string>`coalesce(sum(${investments.principalMinor}), 0)::text`,
      })
      .from(investments)
      .groupBy(investments.status)
      .orderBy(investments.status);
  }

  async customerGrowth(range: ReportDateRange = {}): Promise<Array<{ period: string; count: number }>> {
    const conditions = [];
    if (range.from) conditions.push(gte(customerAccounts.createdAt, range.from));
    if (range.to) conditions.push(lte(customerAccounts.createdAt, range.to));
    return this.db
      .select({
        period: sql<string>`to_char(${customerAccounts.createdAt} at time zone ${nyTz}, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(customerAccounts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(sql`to_char(${customerAccounts.createdAt} at time zone ${nyTz}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${customerAccounts.createdAt} at time zone ${nyTz}, 'YYYY-MM-DD')`);
  }

  async kycStatusDistribution(): Promise<StatusCountRow[]> {
    return this.db
      .select({
        status: customerProfiles.kycStatus,
        count: sql<number>`count(*)::int`,
      })
      .from(customerProfiles)
      .groupBy(customerProfiles.kycStatus)
      .orderBy(customerProfiles.kycStatus);
  }

  async geographyDistribution(): Promise<Array<{ country: string; count: number }>> {
    const rows = await this.db
      .select({
        country: sql<string>`coalesce(${customerProfiles.country}, 'UNKNOWN')`,
        count: sql<number>`count(*)::int`,
      })
      .from(customerProfiles)
      .groupBy(sql`coalesce(${customerProfiles.country}, 'UNKNOWN')`)
      .orderBy(desc(sql`count(*)`));
    return rows;
  }

  async referralStatusCounts(): Promise<{
    referrals: StatusCountRow[];
    rewards: StatusCountRow[];
  }> {
    const [referralRows, rewardRows] = await Promise.all([
      this.db
        .select({
          status: referrals.status,
          count: sql<number>`count(*)::int`,
        })
        .from(referrals)
        .groupBy(referrals.status)
        .orderBy(referrals.status),
      this.db
        .select({
          status: referralRewards.status,
          count: sql<number>`count(*)::int`,
        })
        .from(referralRewards)
        .groupBy(referralRewards.status)
        .orderBy(referralRewards.status),
    ]);
    return { referrals: referralRows, rewards: rewardRows };
  }

  async loginActivity(range: ReportDateRange = {}, limit = 50) {
    const sessionConditions = [];
    if (range.from) sessionConditions.push(gte(sessions.createdAt, range.from));
    if (range.to) sessionConditions.push(lte(sessions.createdAt, range.to));

    const [sessionCounts, securityCounts, recentSessions] = await Promise.all([
      this.db
        .select({
          status: sessions.status,
          count: sql<number>`count(*)::int`,
        })
        .from(sessions)
        .where(sessionConditions.length > 0 ? and(...sessionConditions) : undefined)
        .groupBy(sessions.status),
      this.db
        .select({
          eventType: securityEvents.eventType,
          count: sql<number>`count(*)::int`,
        })
        .from(securityEvents)
        .groupBy(securityEvents.eventType)
        .orderBy(desc(sql`count(*)`))
        .limit(20),
      this.db
        .select({
          id: sessions.id,
          userId: sessions.userId,
          status: sessions.status,
          createdAt: sessions.createdAt,
          lastSeenAt: sessions.lastSeenAt,
        })
        .from(sessions)
        .where(sessionConditions.length > 0 ? and(...sessionConditions) : undefined)
        .orderBy(desc(sessions.createdAt))
        .limit(limit),
    ]);

    return { sessionCounts, securityCounts, recentSessions };
  }

  async listCustomerExportRows(input: {
    from?: Date;
    to?: Date;
    status?: string;
    q?: string;
    limit: number;
  }): Promise<CustomerExportRow[]> {
    const conditions = [];
    if (input.from) conditions.push(gte(customerAccounts.createdAt, input.from));
    if (input.to) conditions.push(lte(customerAccounts.createdAt, input.to));
    if (input.status) conditions.push(eq(customerAccounts.status, input.status as never));
    if (input.q?.trim()) {
      const pattern = `%${input.q.trim()}%`;
      conditions.push(or(ilike(users.email, pattern), ilike(customerProfiles.country, pattern)));
    }

    const rows = await this.db
      .select({
        userId: users.id,
        email: users.email,
        accountStatus: customerAccounts.status,
        kycStatus: customerProfiles.kycStatus,
        riskStatus: customerProfiles.riskStatus,
        country: customerProfiles.country,
        createdAt: customerAccounts.createdAt,
      })
      .from(customerAccounts)
      .innerJoin(users, eq(customerAccounts.userId, users.id))
      .innerJoin(customerProfiles, eq(customerProfiles.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(customerAccounts.createdAt), asc(users.id))
      .limit(input.limit);

    return rows;
  }

  async periodTotals(
    granularity: ReportPeriodGranularity,
    range: ReportDateRange = {},
  ): Promise<PeriodTotalRow[]> {
    const truncUnit =
      granularity === "day"
        ? "day"
        : granularity === "week"
          ? "week"
          : granularity === "month"
            ? "month"
            : "year";

    const depositPeriod = sql<string>`to_char(date_trunc(${sql.raw(`'${truncUnit}'`)}, ${depositIntents.createdAt} at time zone ${nyTz}), 'YYYY-MM-DD')`;
    const withdrawalPeriod = sql<string>`to_char(date_trunc(${sql.raw(`'${truncUnit}'`)}, ${withdrawalRequests.createdAt} at time zone ${nyTz}), 'YYYY-MM-DD')`;
    const roiPeriod = sql<string>`to_char(date_trunc(${sql.raw(`'${truncUnit}'`)}, ${roiLedgerEntries.createdAt} at time zone ${nyTz}), 'YYYY-MM-DD')`;

    const depositConditions = [eq(depositIntents.status, "confirmed")];
    if (range.from) depositConditions.push(gte(depositIntents.createdAt, range.from));
    if (range.to) depositConditions.push(lte(depositIntents.createdAt, range.to));

    const withdrawalConditions = [eq(withdrawalRequests.status, "paid")];
    if (range.from) withdrawalConditions.push(gte(withdrawalRequests.createdAt, range.from));
    if (range.to) withdrawalConditions.push(lte(withdrawalRequests.createdAt, range.to));

    const roiConditions = [eq(roiLedgerEntries.status, "posted")];
    if (range.from) roiConditions.push(gte(roiLedgerEntries.createdAt, range.from));
    if (range.to) roiConditions.push(lte(roiLedgerEntries.createdAt, range.to));

    const [deposits, withdrawals, roi] = await Promise.all([
      this.db
        .select({
          period: depositPeriod,
          amountMinor: sql<string>`coalesce(sum(${depositIntents.amountMinor}), 0)::text`,
          count: sql<number>`count(*)::int`,
        })
        .from(depositIntents)
        .where(and(...depositConditions))
        .groupBy(depositPeriod)
        .orderBy(depositPeriod),
      this.db
        .select({
          period: withdrawalPeriod,
          amountMinor: sql<string>`coalesce(sum(${withdrawalRequests.amountMinor}), 0)::text`,
          count: sql<number>`count(*)::int`,
        })
        .from(withdrawalRequests)
        .where(and(...withdrawalConditions))
        .groupBy(withdrawalPeriod)
        .orderBy(withdrawalPeriod),
      this.db
        .select({
          period: roiPeriod,
          amountMinor: sql<string>`coalesce(sum(${roiLedgerEntries.postedRoiMinor}), 0)::text`,
          count: sql<number>`count(*)::int`,
        })
        .from(roiLedgerEntries)
        .where(and(...roiConditions))
        .groupBy(roiPeriod)
        .orderBy(roiPeriod),
    ]);

    const map = new Map<string, PeriodTotalRow>();
    const ensure = (period: string) => {
      const existing = map.get(period);
      if (existing) return existing;
      const created: PeriodTotalRow = {
        period,
        depositsAmountMinor: "0",
        withdrawalsAmountMinor: "0",
        roiPaidMinor: "0",
        depositsCount: 0,
        withdrawalsCount: 0,
      };
      map.set(period, created);
      return created;
    };

    for (const row of deposits) {
      if (!row.period) continue;
      const entry = ensure(row.period);
      entry.depositsAmountMinor = row.amountMinor;
      entry.depositsCount = row.count;
    }
    for (const row of withdrawals) {
      if (!row.period) continue;
      const entry = ensure(row.period);
      entry.withdrawalsAmountMinor = row.amountMinor;
      entry.withdrawalsCount = row.count;
    }
    for (const row of roi) {
      if (!row.period) continue;
      const entry = ensure(row.period);
      entry.roiPaidMinor = row.amountMinor;
    }

    return [...map.values()].sort((a, b) => a.period.localeCompare(b.period));
  }

  async ledgerSummary() {
    const [transactions, entries] = await Promise.all([
      this.db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(ledgerTransactions),
      this.db
        .select({
          direction: ledgerEntries.direction,
          count: sql<number>`count(*)::int`,
          amountMinor: sql<string>`coalesce(sum(${ledgerEntries.amountMinor}), 0)::text`,
        })
        .from(ledgerEntries)
        .groupBy(ledgerEntries.direction),
    ]);

    return {
      transactionCount: transactions[0]?.count ?? 0,
      entriesByDirection: entries,
    };
  }

  async jobStatusCounts(): Promise<StatusCountRow[]> {
    return this.db
      .select({
        status: backgroundJobs.status,
        count: sql<number>`count(*)::int`,
      })
      .from(backgroundJobs)
      .groupBy(backgroundJobs.status)
      .orderBy(backgroundJobs.status);
  }

  async emailStatusCounts(): Promise<StatusCountRow[]> {
    return this.db
      .select({
        status: emailMessages.status,
        count: sql<number>`count(*)::int`,
      })
      .from(emailMessages)
      .groupBy(emailMessages.status)
      .orderBy(emailMessages.status);
  }

  async notificationStats() {
    const [unread, read, byType, deliveryRows] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(isNull(notifications.readAt)),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(isNotNull(notifications.readAt)),
      this.db
        .select({
          type: notifications.type,
          count: sql<number>`count(*)::int`,
        })
        .from(notifications)
        .groupBy(notifications.type)
        .orderBy(desc(sql`count(*)`))
        .limit(50),
      this.db
        .select({
          status: notificationDeliveries.status,
          count: sql<number>`count(*)::int`,
        })
        .from(notificationDeliveries)
        .groupBy(notificationDeliveries.status),
    ]);
    return {
      unread: unread[0]?.count ?? 0,
      read: read[0]?.count ?? 0,
      byType,
      deliveries: deliveryRows,
    };
  }

  async webhookStats() {
    const [byStatus, deadLettered] = await Promise.all([
      this.db
        .select({
          status: paymentProviderEvents.status,
          count: sql<number>`count(*)::int`,
        })
        .from(paymentProviderEvents)
        .groupBy(paymentProviderEvents.status)
        .orderBy(paymentProviderEvents.status),
      this.db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(paymentProviderEvents)
        .where(isNotNull(paymentProviderEvents.deadLetteredAt)),
    ]);
    return {
      byStatus,
      deadLettered: deadLettered[0]?.count ?? 0,
    };
  }

  async securityEventCounts() {
    return this.db
      .select({
        severity: securityEvents.severity,
        count: sql<number>`count(*)::int`,
      })
      .from(securityEvents)
      .groupBy(securityEvents.severity)
      .orderBy(securityEvents.severity);
  }

  async auditActionCounts(limit = 50) {
    return this.db
      .select({
        action: auditLogs.action,
        count: sql<number>`count(*)::int`,
      })
      .from(auditLogs)
      .groupBy(auditLogs.action)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);
  }
}

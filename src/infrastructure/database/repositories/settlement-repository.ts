import { and, desc, eq, gte, inArray, lt, lte, or, sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { coerceBigInt } from "@/lib/coerce-bigint";

import { roiLedgerEntries, settlementItems, settlementRuns } from "../schema";
import type { DrizzleTransactionContext } from "../transactions";
import type { AppDatabaseExecutor } from "../types";
import {
  BaseDrizzleRepository,
  decodeKeysetCursor,
  encodeKeysetCursor,
  singleRow,
} from "./base-repository";

export type SettlementRunRecord = InferSelectModel<typeof settlementRuns>;
export type SettlementItemRecord = InferSelectModel<typeof settlementItems>;
export type RoiLedgerEntryRecord = InferSelectModel<typeof roiLedgerEntries>;

export interface ListSettlementRunsQuery {
  status?: SettlementRunRecord["status"];
  from?: string;
  to?: string;
  cursor?: string;
  limit: number;
}

export interface ListSettlementRunsResult {
  rows: SettlementRunRecord[];
  nextCursor: string | null;
}

export class SettlementRepository extends BaseDrizzleRepository {
  constructor(db: AppDatabaseExecutor) {
    super("settlement", db);
  }

  protected clone(db: AppDatabaseExecutor): SettlementRepository {
    return new SettlementRepository(db);
  }

  async createSettlementRun(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof settlementRuns>,
  ): Promise<SettlementRunRecord> {
    const rows = await context.db.insert(settlementRuns).values(values).returning();
    return singleRow(rows, "createSettlementRun");
  }

  async findCompletedSettlementRun(
    settlementDate: string,
    runType: "daily" | "catch_up" | "manual_replay",
  ): Promise<SettlementRunRecord | null> {
    const rows = await this.db
      .select()
      .from(settlementRuns)
      .where(
        and(
          eq(settlementRuns.settlementDate, settlementDate),
          eq(settlementRuns.runType, runType),
          eq(settlementRuns.status, "completed"),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async markSettlementRunRunning(
    context: DrizzleTransactionContext,
    settlementRunId: string,
    startedAt: Date,
  ): Promise<SettlementRunRecord> {
    const rows = await context.db
      .update(settlementRuns)
      .set({ status: "running", startedAt })
      .where(eq(settlementRuns.id, settlementRunId))
      .returning();

    return singleRow(rows, "markSettlementRunRunning");
  }

  async markSettlementRunCompleted(
    context: DrizzleTransactionContext,
    settlementRunId: string,
    completedAt: Date,
  ): Promise<SettlementRunRecord> {
    const rows = await context.db
      .update(settlementRuns)
      .set({ status: "completed", completedAt })
      .where(eq(settlementRuns.id, settlementRunId))
      .returning();

    return singleRow(rows, "markSettlementRunCompleted");
  }

  async markSettlementRunFailed(
    context: DrizzleTransactionContext,
    settlementRunId: string,
    errorMessage: string,
  ): Promise<SettlementRunRecord> {
    const rows = await context.db
      .update(settlementRuns)
      .set({ status: "failed", errorMessage })
      .where(eq(settlementRuns.id, settlementRunId))
      .returning();

    return singleRow(rows, "markSettlementRunFailed");
  }

  async createSettlementItem(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof settlementItems>,
  ): Promise<SettlementItemRecord> {
    const rows = await context.db.insert(settlementItems).values(values).returning();
    return singleRow(rows, "createSettlementItem");
  }

  async findSettlementItemByInvestmentAndDate(
    investmentId: string,
    settlementDate: string,
  ): Promise<SettlementItemRecord | null> {
    const rows = await this.db
      .select()
      .from(settlementItems)
      .where(
        and(
          eq(settlementItems.investmentId, investmentId),
          eq(settlementItems.settlementDate, settlementDate),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async findSettlementItemByInvestmentAndDateInTransaction(
    context: DrizzleTransactionContext,
    investmentId: string,
    settlementDate: string,
  ): Promise<SettlementItemRecord | null> {
    const rows = await context.db
      .select()
      .from(settlementItems)
      .where(
        and(
          eq(settlementItems.investmentId, investmentId),
          eq(settlementItems.settlementDate, settlementDate),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async createRoiLedgerEntry(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof roiLedgerEntries>,
  ): Promise<RoiLedgerEntryRecord> {
    const rows = await context.db.insert(roiLedgerEntries).values(values).returning();
    return singleRow(rows, "createRoiLedgerEntry");
  }

  async sumPostedRoiMinorByInvestment(investmentId: string): Promise<bigint> {
    const rows = await this.db
      .select({
        total: sql<string>`coalesce(sum(${settlementItems.postedRoiMinor}), 0)::text`,
      })
      .from(settlementItems)
      .where(
        and(eq(settlementItems.investmentId, investmentId), eq(settlementItems.status, "posted")),
      );

    return coerceBigInt(rows[0]?.total ?? "0");
  }

  /** Batch posted ROI totals — avoids N+1 on portfolio list. */
  async sumPostedRoiMinorByInvestmentIds(investmentIds: string[]): Promise<Map<string, bigint>> {
    const totals = new Map<string, bigint>();
    for (const id of investmentIds) totals.set(id, 0n);
    if (investmentIds.length === 0) return totals;

    const rows = await this.db
      .select({
        investmentId: settlementItems.investmentId,
        total: sql<string>`coalesce(sum(${settlementItems.postedRoiMinor}), 0)::text`,
      })
      .from(settlementItems)
      .where(
        and(
          inArray(settlementItems.investmentId, investmentIds),
          eq(settlementItems.status, "posted"),
        ),
      )
      .groupBy(settlementItems.investmentId);

    for (const row of rows) {
      totals.set(row.investmentId, coerceBigInt(row.total ?? "0"));
    }
    return totals;
  }

  async sumPostedRoiMinorByInvestmentInTransaction(
    context: DrizzleTransactionContext,
    investmentId: string,
  ): Promise<bigint> {
    const rows = await context.db
      .select({
        total: sql<string>`coalesce(sum(${settlementItems.postedRoiMinor}), 0)::text`,
      })
      .from(settlementItems)
      .where(
        and(eq(settlementItems.investmentId, investmentId), eq(settlementItems.status, "posted")),
      );

    return coerceBigInt(rows[0]?.total ?? "0");
  }

  async sumRoiLedgerPostedMinorByInvestment(investmentId: string): Promise<bigint> {
    const rows = await this.db
      .select({
        total: sql<string>`coalesce(sum(${roiLedgerEntries.postedRoiMinor}), 0)::text`,
      })
      .from(roiLedgerEntries)
      .where(
        and(eq(roiLedgerEntries.investmentId, investmentId), eq(roiLedgerEntries.status, "posted")),
      );

    return coerceBigInt(rows[0]?.total ?? "0");
  }

  async listSettlementRuns(query: ListSettlementRunsQuery): Promise<ListSettlementRunsResult> {
    const conditions = [];

    if (query.status) conditions.push(eq(settlementRuns.status, query.status));
    if (query.from) conditions.push(gte(settlementRuns.settlementDate, query.from));
    if (query.to) conditions.push(lte(settlementRuns.settlementDate, query.to));
    if (query.cursor) {
      const cursor = decodeKeysetCursor(query.cursor);
      conditions.push(
        or(
          lt(settlementRuns.createdAt, cursor.createdAt),
          and(eq(settlementRuns.createdAt, cursor.createdAt), lt(settlementRuns.id, cursor.id)),
        ),
      );
    }

    const rows = await this.db
      .select()
      .from(settlementRuns)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(settlementRuns.createdAt), desc(settlementRuns.id))
      .limit(query.limit + 1);

    const hasMore = rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;
    const lastRow = pageRows[pageRows.length - 1];
    const nextCursor =
      hasMore && lastRow
        ? encodeKeysetCursor({ createdAt: lastRow.createdAt, id: lastRow.id })
        : null;

    return { rows: pageRows, nextCursor };
  }

  async findSettlementRunById(id: string): Promise<SettlementRunRecord | null> {
    const rows = await this.db
      .select()
      .from(settlementRuns)
      .where(eq(settlementRuns.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async listSettlementItemsByRunId(runId: string, limit = 200): Promise<SettlementItemRecord[]> {
    return this.db
      .select()
      .from(settlementItems)
      .where(eq(settlementItems.settlementRunId, runId))
      .orderBy(desc(settlementItems.createdAt))
      .limit(limit);
  }

  async listSettlementItemsByInvestmentId(
    investmentId: string,
    limit = 200,
  ): Promise<SettlementItemRecord[]> {
    return this.db
      .select()
      .from(settlementItems)
      .where(eq(settlementItems.investmentId, investmentId))
      .orderBy(desc(settlementItems.settlementDate))
      .limit(limit);
  }
}

import { and, eq, sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { roiLedgerEntries, settlementItems, settlementRuns } from "../schema";
import type { DrizzleTransactionContext } from "../transactions";
import type { AppDatabaseExecutor } from "../types";
import { BaseDrizzleRepository, singleRow } from "./base-repository";

export type SettlementRunRecord = InferSelectModel<typeof settlementRuns>;
export type SettlementItemRecord = InferSelectModel<typeof settlementItems>;
export type RoiLedgerEntryRecord = InferSelectModel<typeof roiLedgerEntries>;

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
        total: sql<bigint>`coalesce(sum(${settlementItems.postedRoiMinor}), 0)::bigint`,
      })
      .from(settlementItems)
      .where(
        and(eq(settlementItems.investmentId, investmentId), eq(settlementItems.status, "posted")),
      );

    return rows[0]?.total ?? 0n;
  }

  async sumPostedRoiMinorByInvestmentInTransaction(
    context: DrizzleTransactionContext,
    investmentId: string,
  ): Promise<bigint> {
    const rows = await context.db
      .select({
        total: sql<bigint>`coalesce(sum(${settlementItems.postedRoiMinor}), 0)::bigint`,
      })
      .from(settlementItems)
      .where(
        and(eq(settlementItems.investmentId, investmentId), eq(settlementItems.status, "posted")),
      );

    return rows[0]?.total ?? 0n;
  }

  async sumRoiLedgerPostedMinorByInvestment(investmentId: string): Promise<bigint> {
    const rows = await this.db
      .select({
        total: sql<bigint>`coalesce(sum(${roiLedgerEntries.postedRoiMinor}), 0)::bigint`,
      })
      .from(roiLedgerEntries)
      .where(
        and(eq(roiLedgerEntries.investmentId, investmentId), eq(roiLedgerEntries.status, "posted")),
      );

    return rows[0]?.total ?? 0n;
  }
}

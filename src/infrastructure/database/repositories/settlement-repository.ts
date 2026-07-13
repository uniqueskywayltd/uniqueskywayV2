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

  async createSettlementItem(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof settlementItems>,
  ): Promise<SettlementItemRecord> {
    const rows = await context.db.insert(settlementItems).values(values).returning();
    return singleRow(rows, "createSettlementItem");
  }

  async createRoiLedgerEntry(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof roiLedgerEntries>,
  ): Promise<RoiLedgerEntryRecord> {
    const rows = await context.db.insert(roiLedgerEntries).values(values).returning();
    return singleRow(rows, "createRoiLedgerEntry");
  }
}

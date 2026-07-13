import { eq } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { investments, roiScheduleItems } from "../schema";
import type { DrizzleTransactionContext } from "../transactions";
import type { AppDatabaseExecutor } from "../types";
import { BaseDrizzleRepository, singleRow } from "./base-repository";

export type InvestmentRecord = InferSelectModel<typeof investments>;
export type RoiScheduleItemRecord = InferSelectModel<typeof roiScheduleItems>;

export class InvestmentRepository extends BaseDrizzleRepository {
  constructor(db: AppDatabaseExecutor) {
    super("investments", db);
  }

  protected clone(db: AppDatabaseExecutor): InvestmentRepository {
    return new InvestmentRepository(db);
  }

  async findInvestmentById(id: string): Promise<InvestmentRecord | null> {
    const rows = await this.db.select().from(investments).where(eq(investments.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async createInvestment(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof investments>,
  ): Promise<InvestmentRecord> {
    const rows = await context.db.insert(investments).values(values).returning();
    return singleRow(rows, "createInvestment");
  }

  async createRoiScheduleItem(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof roiScheduleItems>,
  ): Promise<RoiScheduleItemRecord> {
    const rows = await context.db.insert(roiScheduleItems).values(values).returning();
    return singleRow(rows, "createRoiScheduleItem");
  }
}

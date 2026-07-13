import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { depositIntents, paymentProviderEvents, withdrawalRequests } from "../schema";
import type { DrizzleTransactionContext } from "../transactions";
import type { AppDatabaseExecutor } from "../types";
import { BaseDrizzleRepository, singleRow } from "./base-repository";

export type DepositIntentRecord = InferSelectModel<typeof depositIntents>;
export type WithdrawalRequestRecord = InferSelectModel<typeof withdrawalRequests>;
export type PaymentProviderEventRecord = InferSelectModel<typeof paymentProviderEvents>;

export class PaymentRepository extends BaseDrizzleRepository {
  constructor(db: AppDatabaseExecutor) {
    super("payments", db);
  }

  protected clone(db: AppDatabaseExecutor): PaymentRepository {
    return new PaymentRepository(db);
  }

  async createDepositIntent(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof depositIntents>,
  ): Promise<DepositIntentRecord> {
    const rows = await context.db.insert(depositIntents).values(values).returning();
    return singleRow(rows, "createDepositIntent");
  }

  async createWithdrawalRequest(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof withdrawalRequests>,
  ): Promise<WithdrawalRequestRecord> {
    const rows = await context.db.insert(withdrawalRequests).values(values).returning();
    return singleRow(rows, "createWithdrawalRequest");
  }

  async recordProviderEvent(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof paymentProviderEvents>,
  ): Promise<PaymentProviderEventRecord> {
    const rows = await context.db.insert(paymentProviderEvents).values(values).returning();
    return singleRow(rows, "recordProviderEvent");
  }
}

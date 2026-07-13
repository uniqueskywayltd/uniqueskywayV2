import { randomUUID } from "node:crypto";

import type { TransactionContext, TransactionManager } from "@/application/ports/database";

import type { AppDatabase, AppTransaction } from "../types";

export interface DrizzleTransactionContext extends TransactionContext {
  readonly db: AppTransaction;
  readonly transactionId: string;
}

export class DrizzleTransactionManager implements TransactionManager<DrizzleTransactionContext> {
  constructor(private readonly db: Pick<AppDatabase, "transaction">) {}

  runInTransaction<TResult>(
    work: (context: DrizzleTransactionContext) => Promise<TResult>,
  ): Promise<TResult> {
    return this.db.transaction((tx) =>
      work({
        db: tx,
        transactionId: randomUUID(),
      }),
    );
  }
}

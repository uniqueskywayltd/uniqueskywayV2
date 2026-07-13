import type { TransactionalRepository } from "@/application/ports/repository";

import type { DrizzleTransactionContext } from "../transactions";
import type { AppDatabaseExecutor } from "../types";

export abstract class BaseDrizzleRepository implements TransactionalRepository<DrizzleTransactionContext> {
  protected constructor(
    public readonly repositoryName: string,
    protected readonly db: AppDatabaseExecutor,
  ) {}

  withTransaction(context: DrizzleTransactionContext): this {
    return this.clone(context.db) as this;
  }

  protected abstract clone(db: AppDatabaseExecutor): BaseDrizzleRepository;
}

export function singleRow<TRecord>(rows: TRecord[], operation: string): TRecord {
  const row = rows[0];

  if (!row) {
    throw new Error(`Expected ${operation} to return one row.`);
  }

  return row;
}

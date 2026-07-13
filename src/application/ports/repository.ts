import type { TransactionContext } from "@/application/ports/database";

export interface Repository {
  readonly repositoryName: string;
}

export interface TransactionalRepository<
  TContext extends TransactionContext = TransactionContext,
> extends Repository {
  withTransaction(context: TContext): TransactionalRepository<TContext>;
}

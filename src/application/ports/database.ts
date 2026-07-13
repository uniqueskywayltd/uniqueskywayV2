export interface TransactionContext {
  readonly transactionId?: string;
}

export interface TransactionManager<TContext extends TransactionContext = TransactionContext> {
  runInTransaction<TResult>(work: (context: TContext) => Promise<TResult>): Promise<TResult>;
}

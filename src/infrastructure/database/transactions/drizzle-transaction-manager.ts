import { randomUUID } from "node:crypto";

import type { TransactionContext, TransactionManager } from "@/application/ports/database";

import type { AppDatabase, AppTransaction } from "../types";

export interface DrizzleTransactionContext extends TransactionContext {
  readonly db: AppTransaction;
  readonly transactionId: string;
}

export interface DrizzleTransactionManagerOptions {
  readonly maxRetries?: number;
  readonly retryDelayMs?: number;
}

const RETRYABLE_POSTGRES_TRANSACTION_CODES = new Set(["40001", "40P01", "57014"]);
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 25;

export class DrizzleTransactionManager implements TransactionManager<DrizzleTransactionContext> {
  constructor(
    private readonly db: Pick<AppDatabase, "transaction">,
    private readonly options: DrizzleTransactionManagerOptions = {},
  ) {}

  async runInTransaction<TResult>(
    work: (context: DrizzleTransactionContext) => Promise<TResult>,
  ): Promise<TResult> {
    const maxRetries = this.options.maxRetries ?? DEFAULT_MAX_RETRIES;
    const retryDelayMs = this.options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;

    for (let attempt = 0; ; attempt += 1) {
      try {
        return await this.db.transaction((tx) =>
          work({
            db: tx,
            transactionId: randomUUID(),
          }),
        );
      } catch (error) {
        if (attempt >= maxRetries || !isRetryableTransactionError(error)) {
          throw error;
        }

        await delay(retryDelayMs);
      }
    }
  }
}

function isRetryableTransactionError(error: unknown): boolean {
  let cursor: unknown = error;

  for (let depth = 0; depth < 3; depth += 1) {
    if (!cursor || typeof cursor !== "object") return false;

    const code = (cursor as { code?: unknown }).code;
    if (typeof code === "string" && RETRYABLE_POSTGRES_TRANSACTION_CODES.has(code)) {
      return true;
    }

    cursor = (cursor as { cause?: unknown }).cause;
  }

  return false;
}

function delay(milliseconds: number) {
  if (milliseconds <= 0) return Promise.resolve();

  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

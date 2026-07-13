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

export interface KeysetCursor {
  createdAt: Date;
  id: string;
}

export function encodeKeysetCursor(cursor: KeysetCursor): string {
  return Buffer.from(
    JSON.stringify({ createdAt: cursor.createdAt.toISOString(), id: cursor.id }),
  ).toString("base64url");
}

export function decodeKeysetCursor(cursor: string): KeysetCursor {
  const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as {
    createdAt: string;
    id: string;
  };
  return { createdAt: new Date(decoded.createdAt), id: decoded.id };
}

export function paginateKeysetRows<TRecord extends { createdAt: Date; id: string }>(
  rows: TRecord[],
  limit: number,
): { rows: TRecord[]; nextCursor: string | null } {
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const lastRow = pageRows[pageRows.length - 1];
  const nextCursor =
    hasMore && lastRow ? encodeKeysetCursor({ createdAt: lastRow.createdAt, id: lastRow.id }) : null;

  return { rows: pageRows, nextCursor };
}

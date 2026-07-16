import { and, desc, eq, sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import {
  ledgerAccounts,
  ledgerEntries,
  ledgerTransactions,
  walletAccountLinks,
  wallets,
} from "../schema";
import type { DrizzleTransactionContext } from "../transactions";
import type { AppDatabaseExecutor } from "../types";
import { BaseDrizzleRepository, singleRow } from "./base-repository";

export type WalletRecord = InferSelectModel<typeof wallets>;
export type LedgerAccountRecord = InferSelectModel<typeof ledgerAccounts>;
export type LedgerTransactionRecord = InferSelectModel<typeof ledgerTransactions>;
export type LedgerEntryRecord = InferSelectModel<typeof ledgerEntries>;

export interface LedgerPostingInput {
  transaction: InferInsertModel<typeof ledgerTransactions>;
  entries: Array<Omit<InferInsertModel<typeof ledgerEntries>, "ledgerTransactionId">>;
}

export interface WalletBalanceRecord {
  walletId: string;
  userId: string;
  currency: string;
  pendingBalanceMinor: bigint;
  availableBalanceMinor: bigint;
  lockedBalanceMinor: bigint;
  reservedBalanceMinor: bigint;
  withdrawnBalanceMinor: bigint;
  lastEntryAt: Date | null;
}

export interface WalletLedgerEventRecord {
  transactionId: string;
  transactionType: string;
  referenceType: string;
  referenceId: string;
  description: string | null;
  postedAt: Date;
  amountMinor: bigint;
  direction: "debit" | "credit";
  currency: string;
  walletCategory: "pending" | "available" | "locked" | "reserved" | "withdrawn";
}

const WALLET_CATEGORY_PRIORITY: Record<WalletLedgerEventRecord["walletCategory"], number> = {
  available: 0,
  pending: 1,
  reserved: 2,
  locked: 3,
  withdrawn: 4,
};

function coerceDate(value: Date | string | number): Date {
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ledger postedAt value: ${String(value)}`);
  }
  return parsed;
}

function coerceBigInt(value: bigint | number | string): bigint {
  if (typeof value === "bigint") return value;
  return BigInt(value);
}

function normalizeWalletLedgerEvent(row: WalletLedgerEventRecord): WalletLedgerEventRecord {
  return {
    ...row,
    postedAt: coerceDate(row.postedAt),
    amountMinor: coerceBigInt(row.amountMinor),
  };
}

/** Prefer the customer-facing leg when a posting touches multiple wallet categories. */
export function pickPrimaryWalletLedgerEvents(
  rows: WalletLedgerEventRecord[],
  limit: number,
): WalletLedgerEventRecord[] {
  const byTransaction = new Map<string, WalletLedgerEventRecord>();

  for (const row of rows) {
    const normalized = normalizeWalletLedgerEvent(row);
    const existing = byTransaction.get(normalized.transactionId);
    if (!existing) {
      byTransaction.set(normalized.transactionId, normalized);
      continue;
    }

    const existingRank = WALLET_CATEGORY_PRIORITY[existing.walletCategory] ?? 99;
    const nextRank = WALLET_CATEGORY_PRIORITY[normalized.walletCategory] ?? 99;
    if (nextRank < existingRank) {
      byTransaction.set(normalized.transactionId, normalized);
    }
  }

  return [...byTransaction.values()]
    .sort((left, right) => right.postedAt.getTime() - left.postedAt.getTime())
    .slice(0, limit);
}

function rowsFromExecute<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && Array.isArray((result as { rows?: unknown }).rows)) {
    return (result as { rows: T[] }).rows;
  }
  return [];
}

function mapWalletBalanceRow(row: Record<string, unknown>): WalletBalanceRecord {
  return {
    walletId: String(row.walletId ?? row.wallet_id),
    userId: String(row.userId ?? row.user_id),
    currency: String(row.currency),
    pendingBalanceMinor: coerceBigInt(
      (row.pendingBalanceMinor ?? row.pending_balance_minor ?? 0) as string | number | bigint,
    ),
    availableBalanceMinor: coerceBigInt(
      (row.availableBalanceMinor ?? row.available_balance_minor ?? 0) as string | number | bigint,
    ),
    lockedBalanceMinor: coerceBigInt(
      (row.lockedBalanceMinor ?? row.locked_balance_minor ?? 0) as string | number | bigint,
    ),
    reservedBalanceMinor: coerceBigInt(
      (row.reservedBalanceMinor ?? row.reserved_balance_minor ?? 0) as string | number | bigint,
    ),
    withdrawnBalanceMinor: coerceBigInt(
      (row.withdrawnBalanceMinor ?? row.withdrawn_balance_minor ?? 0) as string | number | bigint,
    ),
    lastEntryAt: (() => {
      const raw = row.lastEntryAt ?? row.last_entry_at;
      if (raw == null || raw === "") return null;
      return coerceDate(raw as Date | string | number);
    })(),
  };
}

export class LedgerRepository extends BaseDrizzleRepository {
  constructor(db: AppDatabaseExecutor) {
    super("ledger", db);
  }

  protected clone(db: AppDatabaseExecutor): LedgerRepository {
    return new LedgerRepository(db);
  }

  async createWallet(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof wallets>,
  ): Promise<WalletRecord> {
    const rows = await context.db.insert(wallets).values(values).returning();
    return singleRow(rows, "createWallet");
  }

  async ensureWallet(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof wallets>,
  ): Promise<WalletRecord> {
    const rows = await context.db
      .insert(wallets)
      .values(values)
      .onConflictDoUpdate({
        target: [wallets.userId, wallets.currency],
        set: {
          updatedAt: new Date(),
        },
      })
      .returning();

    return singleRow(rows, "ensureWallet");
  }

  async createLedgerAccount(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof ledgerAccounts>,
  ): Promise<LedgerAccountRecord> {
    const rows = await context.db.insert(ledgerAccounts).values(values).returning();
    return singleRow(rows, "createLedgerAccount");
  }

  async ensureLedgerAccount(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof ledgerAccounts>,
  ): Promise<LedgerAccountRecord> {
    const rows = await context.db
      .insert(ledgerAccounts)
      .values(values)
      .onConflictDoUpdate({
        target: [
          ledgerAccounts.ownerType,
          ledgerAccounts.ownerId,
          ledgerAccounts.accountType,
          ledgerAccounts.currency,
        ],
        set: {
          status: "active",
        },
      })
      .returning();

    return singleRow(rows, "ensureLedgerAccount");
  }

  async linkWalletAccount(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof walletAccountLinks>,
  ): Promise<void> {
    await context.db.insert(walletAccountLinks).values(values);
  }

  async ensureWalletAccountLink(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof walletAccountLinks>,
  ): Promise<void> {
    await context.db
      .insert(walletAccountLinks)
      .values(values)
      .onConflictDoNothing({
        target: [walletAccountLinks.walletId, walletAccountLinks.category],
      });
  }

  async findLedgerAccountById(id: string): Promise<LedgerAccountRecord | null> {
    const rows = await this.db
      .select()
      .from(ledgerAccounts)
      .where(eq(ledgerAccounts.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findWalletByUserCurrency(userId: string, currency: string): Promise<WalletRecord | null> {
    const rows = await this.db
      .select()
      .from(wallets)
      .where(and(eq(wallets.userId, userId), eq(wallets.currency, currency)))
      .limit(1);

    return rows[0] ?? null;
  }

  async lockWalletByUserCurrency(
    context: DrizzleTransactionContext,
    userId: string,
    currency: string,
  ): Promise<void> {
    await context.db.execute(sql`
      select id
      from public.wallets
      where user_id = ${userId}
        and currency = ${currency}
      for update
    `);
  }

  async findWalletAccountByCategory(input: {
    walletId: string;
    category: "pending" | "available" | "locked" | "reserved" | "withdrawn";
  }): Promise<LedgerAccountRecord | null> {
    const rows = await this.db
      .select({ account: ledgerAccounts })
      .from(walletAccountLinks)
      .innerJoin(ledgerAccounts, eq(walletAccountLinks.ledgerAccountId, ledgerAccounts.id))
      .where(
        and(
          eq(walletAccountLinks.walletId, input.walletId),
          eq(walletAccountLinks.category, input.category),
        ),
      )
      .limit(1);

    return rows[0]?.account ?? null;
  }

  async findWalletAccountByCategoryInTransaction(
    context: DrizzleTransactionContext,
    input: {
      walletId: string;
      category: "pending" | "available" | "locked" | "reserved" | "withdrawn";
    },
  ): Promise<LedgerAccountRecord | null> {
    const rows = await context.db
      .select({ account: ledgerAccounts })
      .from(walletAccountLinks)
      .innerJoin(ledgerAccounts, eq(walletAccountLinks.ledgerAccountId, ledgerAccounts.id))
      .where(
        and(
          eq(walletAccountLinks.walletId, input.walletId),
          eq(walletAccountLinks.category, input.category),
        ),
      )
      .limit(1);

    return rows[0]?.account ?? null;
  }

  async findWalletBalance(walletId: string): Promise<WalletBalanceRecord | null> {
    const rows = rowsFromExecute<Record<string, unknown>>(
      await this.db.execute(sql`
      select
        wallet_id as "walletId",
        user_id as "userId",
        currency,
        pending_balance_minor as "pendingBalanceMinor",
        available_balance_minor as "availableBalanceMinor",
        locked_balance_minor as "lockedBalanceMinor",
        reserved_balance_minor as "reservedBalanceMinor",
        withdrawn_balance_minor as "withdrawnBalanceMinor",
        last_entry_at as "lastEntryAt"
      from public.wallet_balances
      where wallet_id = ${walletId}
      limit 1
    `),
    );

    return rows[0] ? mapWalletBalanceRow(rows[0]) : null;
  }

  async findWalletBalanceByUserCurrency(
    userId: string,
    currency: string,
  ): Promise<WalletBalanceRecord | null> {
    const rows = rowsFromExecute<Record<string, unknown>>(
      await this.db.execute(sql`
      select
        wallet_id as "walletId",
        user_id as "userId",
        currency,
        pending_balance_minor as "pendingBalanceMinor",
        available_balance_minor as "availableBalanceMinor",
        locked_balance_minor as "lockedBalanceMinor",
        reserved_balance_minor as "reservedBalanceMinor",
        withdrawn_balance_minor as "withdrawnBalanceMinor",
        last_entry_at as "lastEntryAt"
      from public.wallet_balances
      where user_id = ${userId}
        and currency = ${currency}
      limit 1
    `),
    );

    return rows[0] ? mapWalletBalanceRow(rows[0]) : null;
  }

  async findWalletBalanceByUserCurrencyInTransaction(
    context: DrizzleTransactionContext,
    userId: string,
    currency: string,
  ): Promise<WalletBalanceRecord | null> {
    const rows = rowsFromExecute<Record<string, unknown>>(
      await context.db.execute(sql`
      select
        wallet_id as "walletId",
        user_id as "userId",
        currency,
        pending_balance_minor as "pendingBalanceMinor",
        available_balance_minor as "availableBalanceMinor",
        locked_balance_minor as "lockedBalanceMinor",
        reserved_balance_minor as "reservedBalanceMinor",
        withdrawn_balance_minor as "withdrawnBalanceMinor",
        last_entry_at as "lastEntryAt"
      from public.wallet_balances
      where user_id = ${userId}
        and currency = ${currency}
      limit 1
    `),
    );

    return rows[0] ? mapWalletBalanceRow(rows[0]) : null;
  }

  async listWalletLedgerEvents(
    userId: string,
    currency: string,
    limit = 50,
  ): Promise<WalletLedgerEventRecord[]> {
    const fetchLimit = Math.min(Math.max(limit, 1), 200) * 8;
    const rows = await this.db
      .select({
        transactionId: ledgerTransactions.id,
        transactionType: ledgerTransactions.transactionType,
        referenceType: ledgerTransactions.referenceType,
        referenceId: ledgerTransactions.referenceId,
        description: ledgerTransactions.description,
        postedAt: ledgerTransactions.postedAt,
        amountMinor: ledgerEntries.amountMinor,
        direction: ledgerEntries.direction,
        currency: ledgerEntries.currency,
        walletCategory: walletAccountLinks.category,
      })
      .from(ledgerTransactions)
      .innerJoin(ledgerEntries, eq(ledgerEntries.ledgerTransactionId, ledgerTransactions.id))
      .innerJoin(
        walletAccountLinks,
        eq(walletAccountLinks.ledgerAccountId, ledgerEntries.accountId),
      )
      .innerJoin(wallets, eq(wallets.id, walletAccountLinks.walletId))
      .where(and(eq(wallets.userId, userId), eq(wallets.currency, currency)))
      .orderBy(
        desc(ledgerTransactions.postedAt),
        desc(ledgerTransactions.id),
        desc(ledgerEntries.createdAt),
      )
      .limit(fetchLimit);

    return pickPrimaryWalletLedgerEvents(rows, limit);
  }

  async postLedgerTransaction(
    context: DrizzleTransactionContext,
    input: LedgerPostingInput,
  ): Promise<{ transaction: LedgerTransactionRecord; entries: LedgerEntryRecord[] }> {
    const transactionRows = await context.db
      .insert(ledgerTransactions)
      .values(input.transaction)
      .returning();
    const transaction = singleRow(transactionRows, "postLedgerTransaction.transaction");
    const entryRows = await context.db
      .insert(ledgerEntries)
      .values(
        input.entries.map((entry) => ({
          ...entry,
          ledgerTransactionId: transaction.id,
        })),
      )
      .returning();

    return { transaction, entries: entryRows };
  }
}

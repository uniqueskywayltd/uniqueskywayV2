import { and, eq, sql } from "drizzle-orm";
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

/** Prefer the customer-facing leg when a posting touches multiple wallet categories. */
export function pickPrimaryWalletLedgerEvents(
  rows: WalletLedgerEventRecord[],
  limit: number,
): WalletLedgerEventRecord[] {
  const byTransaction = new Map<string, WalletLedgerEventRecord>();

  for (const row of rows) {
    const existing = byTransaction.get(row.transactionId);
    if (!existing) {
      byTransaction.set(row.transactionId, row);
      continue;
    }

    const existingRank = WALLET_CATEGORY_PRIORITY[existing.walletCategory] ?? 99;
    const nextRank = WALLET_CATEGORY_PRIORITY[row.walletCategory] ?? 99;
    if (nextRank < existingRank) {
      byTransaction.set(row.transactionId, row);
    }
  }

  return [...byTransaction.values()]
    .sort((left, right) => right.postedAt.getTime() - left.postedAt.getTime())
    .slice(0, limit);
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
    const rows = (await this.db.execute(sql`
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
    `)) as unknown as WalletBalanceRecord[];

    return rows[0] ?? null;
  }

  async findWalletBalanceByUserCurrency(
    userId: string,
    currency: string,
  ): Promise<WalletBalanceRecord | null> {
    const rows = (await this.db.execute(sql`
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
    `)) as unknown as WalletBalanceRecord[];

    return rows[0] ?? null;
  }

  async findWalletBalanceByUserCurrencyInTransaction(
    context: DrizzleTransactionContext,
    userId: string,
    currency: string,
  ): Promise<WalletBalanceRecord | null> {
    const rows = (await context.db.execute(sql`
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
    `)) as unknown as WalletBalanceRecord[];

    return rows[0] ?? null;
  }

  async listWalletLedgerEvents(
    userId: string,
    currency: string,
    limit = 50,
  ): Promise<WalletLedgerEventRecord[]> {
    const rows = (await this.db.execute(sql`
      select
        lt.id as "transactionId",
        lt.transaction_type as "transactionType",
        lt.reference_type as "referenceType",
        lt.reference_id as "referenceId",
        lt.description as "description",
        lt.posted_at as "postedAt",
        le.amount_minor as "amountMinor",
        le.direction as "direction",
        le.currency as "currency",
        wal.category as "walletCategory"
      from public.ledger_transactions lt
      inner join public.ledger_entries le on le.ledger_transaction_id = lt.id
      inner join public.wallet_account_links wal on wal.ledger_account_id = le.account_id
      inner join public.wallets w on w.id = wal.wallet_id
      where w.user_id = ${userId}
        and w.currency = ${currency}
      order by lt.posted_at desc, lt.id desc, le.created_at desc
      limit ${Math.min(Math.max(limit, 1), 200) * 8}
    `)) as unknown as WalletLedgerEventRecord[];

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

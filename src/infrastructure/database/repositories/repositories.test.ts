import { describe, expect, it, vi } from "vitest";

import { LedgerRepository } from ".";
import type { DrizzleTransactionContext } from "../transactions";

describe("database repositories", () => {
  it("posts a ledger transaction and entries through one transaction context", async () => {
    const transactionRow = { id: "ledger_txn_1" };
    const entryRows = [{ id: "entry_1" }, { id: "entry_2" }];
    const insertedValues: unknown[] = [];

    const tx = {
      insert: vi.fn(() => ({
        values: vi.fn((values: unknown) => {
          insertedValues.push(values);

          return {
            returning: vi.fn(async () => (Array.isArray(values) ? entryRows : [transactionRow])),
          };
        }),
      })),
    };

    const context = {
      db: tx,
      transactionId: "transaction-context-1",
    } as unknown as DrizzleTransactionContext;

    const repository = new LedgerRepository(tx as never);
    const result = await repository.postLedgerTransaction(context, {
      transaction: {
        transactionType: "roi_settlement",
        referenceType: "investment",
        referenceId: "investment_1",
        idempotencyKey: "roi:investment_1:2026-07-12",
      },
      entries: [
        {
          ledgerTransactionId: "ledger_txn_1",
          accountId: "platform_roi_expense",
          direction: "debit",
          amountMinor: 100n,
          currency: "USD",
        },
        {
          ledgerTransactionId: "ledger_txn_1",
          accountId: "customer_available_cash",
          direction: "credit",
          amountMinor: 100n,
          currency: "USD",
        },
      ],
    });

    expect(tx.insert).toHaveBeenCalledTimes(2);
    expect(insertedValues).toHaveLength(2);
    expect(result.transaction).toBe(transactionRow);
    expect(result.entries).toBe(entryRows);
  });

  it("clones repositories onto an explicit transaction context", () => {
    const db = {};
    const tx = {};
    const repository = new LedgerRepository(db as never);
    const transactionalRepository = repository.withTransaction({
      db: tx,
      transactionId: "transaction-context-2",
    } as unknown as DrizzleTransactionContext);

    expect(transactionalRepository).toBeInstanceOf(LedgerRepository);
    expect(transactionalRepository).not.toBe(repository);
    expect(transactionalRepository.repositoryName).toBe("ledger");
  });
});

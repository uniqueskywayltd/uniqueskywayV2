import { describe, expect, it, vi } from "vitest";

import { DrizzleTransactionManager } from ".";

describe("DrizzleTransactionManager", () => {
  it("creates a transaction context and delegates work to the database transaction", async () => {
    const tx = {};
    const db = {
      transaction: vi.fn(async (work: (context: unknown) => Promise<string>) => work(tx)),
    };
    const manager = new DrizzleTransactionManager(db as never);

    const result = await manager.runInTransaction(async (context) => {
      expect(context.db).toBe(tx);
      expect(context.transactionId).toEqual(expect.any(String));
      return "committed";
    });

    expect(result).toBe("committed");
    expect(db.transaction).toHaveBeenCalledTimes(1);
  });

  it("propagates rollback failures to callers", async () => {
    const db = {
      transaction: vi.fn(async (work: (context: unknown) => Promise<unknown>) => work({})),
    };
    const manager = new DrizzleTransactionManager(db as never);

    await expect(
      manager.runInTransaction(async () => {
        throw new Error("rollback me");
      }),
    ).rejects.toThrow("rollback me");
  });

  it("retries PostgreSQL serialization failures", async () => {
    let attempts = 0;
    const db = {
      transaction: vi.fn(async (work: (context: unknown) => Promise<string>) => {
        attempts += 1;
        if (attempts < 3) {
          throw postgresTransactionError("40001");
        }

        return work({ attempt: attempts });
      }),
    };
    const manager = new DrizzleTransactionManager(db as never, {
      maxRetries: 3,
      retryDelayMs: 0,
    });

    const result = await manager.runInTransaction(async () => "committed after retry");

    expect(result).toBe("committed after retry");
    expect(db.transaction).toHaveBeenCalledTimes(3);
  });

  it("retries PostgreSQL deadlock failures", async () => {
    let attempts = 0;
    const db = {
      transaction: vi.fn(async (work: (context: unknown) => Promise<string>) => {
        attempts += 1;
        if (attempts === 1) {
          throw postgresTransactionError("40P01");
        }

        return work({ attempt: attempts });
      }),
    };
    const manager = new DrizzleTransactionManager(db as never, {
      maxRetries: 2,
      retryDelayMs: 0,
    });

    const result = await manager.runInTransaction(async () => "committed after deadlock retry");

    expect(result).toBe("committed after deadlock retry");
    expect(db.transaction).toHaveBeenCalledTimes(2);
  });

  it("retries PostgreSQL query timeout failures", async () => {
    let attempts = 0;
    const db = {
      transaction: vi.fn(async (work: (context: unknown) => Promise<string>) => {
        attempts += 1;
        if (attempts === 1) {
          throw postgresTransactionError("57014");
        }

        return work({ attempt: attempts });
      }),
    };
    const manager = new DrizzleTransactionManager(db as never, {
      maxRetries: 2,
      retryDelayMs: 0,
    });

    const result = await manager.runInTransaction(async () => "committed after timeout retry");

    expect(result).toBe("committed after timeout retry");
    expect(db.transaction).toHaveBeenCalledTimes(2);
  });

  it("stops retrying after the configured retry limit", async () => {
    const db = {
      transaction: vi.fn(async () => {
        throw postgresTransactionError("40001");
      }),
    };
    const manager = new DrizzleTransactionManager(db as never, {
      maxRetries: 1,
      retryDelayMs: 0,
    });

    await expect(manager.runInTransaction(async () => "never committed")).rejects.toMatchObject({
      code: "40001",
    });
    expect(db.transaction).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-retryable transaction failures", async () => {
    const db = {
      transaction: vi.fn(async () => {
        throw postgresTransactionError("23505");
      }),
    };
    const manager = new DrizzleTransactionManager(db as never, {
      maxRetries: 3,
      retryDelayMs: 0,
    });

    await expect(manager.runInTransaction(async () => "never committed")).rejects.toMatchObject({
      code: "23505",
    });
    expect(db.transaction).toHaveBeenCalledTimes(1);
  });
});

function postgresTransactionError(code: string) {
  return Object.assign(new Error(`PostgreSQL transaction error ${code}`), { code });
}

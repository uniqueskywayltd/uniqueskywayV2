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
});

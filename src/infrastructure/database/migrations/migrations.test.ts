import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { databaseMigrations, runSqlMigrations } from ".";
import type { MigrationSqlClient } from ".";

class FakeMigrationClient implements MigrationSqlClient {
  readonly applied = new Set<string>();
  readonly queries: string[] = [];

  constructor(private readonly failWhenQueryIncludes?: string) {}

  async unsafe<TRecord extends Record<string, unknown> = Record<string, unknown>>(
    query: string,
  ): Promise<TRecord[]> {
    this.queries.push(query);

    if (this.failWhenQueryIncludes && query.includes(this.failWhenQueryIncludes)) {
      throw new Error("simulated migration failure");
    }

    const selectMatch = query.match(/where id = '([^']+)'/);
    if (selectMatch) {
      const id = selectMatch[1] ?? "";
      return (this.applied.has(id) ? [{ id }] : []) as unknown as TRecord[];
    }

    const insertMatch = query.match(/values \('([^']+)'/);
    if (insertMatch && query.includes("schema_migrations")) {
      this.applied.add(insertMatch[1] ?? "");
    }

    return [];
  }

  async begin<TResult>(work: (tx: MigrationSqlClient) => Promise<TResult>): Promise<TResult> {
    const snapshot = new Set(this.applied);

    try {
      return await work(this);
    } catch (error) {
      this.applied.clear();
      for (const id of snapshot) {
        this.applied.add(id);
      }
      throw error;
    }
  }
}

async function createMigrationDirectory() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "usw-migrations-"));

  await Promise.all(
    databaseMigrations.map((migration) =>
      writeFile(
        path.join(directory, migration.fileName),
        `-- ${migration.id}\nselect '${migration.id}';\n`,
        "utf8",
      ),
    ),
  );

  return directory;
}

describe("database migration runner", () => {
  it("keeps migrations in the required logical order", () => {
    expect(databaseMigrations.map((migration) => migration.phase)).toEqual([
      "identity",
      "core",
      "financial",
      "notifications",
      "admin",
      "indexes",
      "seed",
      "customer_experience",
      "investment_engine",
    ]);
  });

  it("applies pending migrations once and skips them after tracking", async () => {
    const migrationsDirectory = await createMigrationDirectory();
    const client = new FakeMigrationClient();

    const firstRun = await runSqlMigrations(client, { migrationsDirectory });
    const secondRun = await runSqlMigrations(client, { migrationsDirectory });

    expect(firstRun.applied).toEqual(databaseMigrations.map((migration) => migration.id));
    expect(secondRun.applied).toEqual([]);
    expect(secondRun.skipped).toEqual(databaseMigrations.map((migration) => migration.id));
  });

  it("rolls back a failed migration transaction and preserves earlier successful migrations", async () => {
    const migrationsDirectory = await createMigrationDirectory();
    const client = new FakeMigrationClient("202607120303_financial");

    await expect(runSqlMigrations(client, { migrationsDirectory })).rejects.toThrow(
      "simulated migration failure",
    );

    expect([...client.applied]).toEqual(["202607120301_identity", "202607120302_core"]);
    expect(client.applied.has("202607120303_financial")).toBe(false);
  });
});

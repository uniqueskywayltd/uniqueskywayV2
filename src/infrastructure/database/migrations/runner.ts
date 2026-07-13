import { readFile } from "node:fs/promises";
import path from "node:path";

import { databaseMigrations } from "./manifest";

export interface MigrationSqlClient {
  unsafe<TRecord extends Record<string, unknown> = Record<string, unknown>>(
    query: string,
  ): Promise<TRecord[]>;
  begin<TResult>(work: (tx: MigrationSqlClient) => Promise<TResult>): Promise<TResult>;
}

export interface RunMigrationsOptions {
  migrationsDirectory?: string;
  dryRun?: boolean;
}

export interface RunMigrationsResult {
  applied: string[];
  skipped: string[];
  pending: string[];
}

function escapeSqlLiteral(value: string): string {
  return value.replaceAll("'", "''");
}

async function ensureMigrationTracking(client: MigrationSqlClient) {
  await client.unsafe("create schema if not exists app_private");
  await client.unsafe(`
    create table if not exists app_private.schema_migrations (
      id varchar(120) primary key,
      file_name varchar(240) not null,
      checksum varchar(128),
      applied_at timestamptz not null default now()
    )
  `);
}

async function hasMigrationBeenApplied(
  client: MigrationSqlClient,
  migrationId: string,
): Promise<boolean> {
  const rows = await client.unsafe<{ id: string }>(
    `select id from app_private.schema_migrations where id = '${escapeSqlLiteral(migrationId)}' limit 1`,
  );

  return rows.length > 0;
}

export async function runSqlMigrations(
  client: MigrationSqlClient,
  options: RunMigrationsOptions = {},
): Promise<RunMigrationsResult> {
  const migrationsDirectory =
    options.migrationsDirectory ?? path.join(process.cwd(), "supabase", "migrations");
  const applied: string[] = [];
  const skipped: string[] = [];
  const pending: string[] = [];

  await ensureMigrationTracking(client);

  for (const migration of databaseMigrations) {
    if (await hasMigrationBeenApplied(client, migration.id)) {
      skipped.push(migration.id);
      continue;
    }

    pending.push(migration.id);

    if (options.dryRun) {
      continue;
    }

    const sql = await readFile(path.join(migrationsDirectory, migration.fileName), "utf8");

    await client.begin(async (tx) => {
      await tx.unsafe(sql);
      await tx.unsafe(`
        insert into app_private.schema_migrations (id, file_name)
        values ('${escapeSqlLiteral(migration.id)}', '${escapeSqlLiteral(migration.fileName)}')
      `);
    });

    applied.push(migration.id);
  }

  return { applied, skipped, pending };
}

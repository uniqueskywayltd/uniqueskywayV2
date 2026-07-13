import postgres from "postgres";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const migrations = [
  ["202607120301_identity", "202607120301_identity.sql"],
  ["202607120302_core", "202607120302_core.sql"],
  ["202607120303_financial", "202607120303_financial.sql"],
  ["202607120304_notifications", "202607120304_notifications.sql"],
  ["202607120305_admin", "202607120305_admin.sql"],
  ["202607120306_indexes", "202607120306_indexes.sql"],
  ["202607120307_seed", "202607120307_seed.sql"],
];

function escapeSqlLiteral(value) {
  return value.replaceAll("'", "''");
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run migrations.");
}

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const migrationsDir = path.join(rootDir, "supabase", "migrations");
const sql = postgres(databaseUrl, { max: 1, prepare: false });

await sql.unsafe("create schema if not exists app_private");
await sql.unsafe(`
  create table if not exists app_private.schema_migrations (
    id varchar(120) primary key,
    file_name varchar(240) not null,
    checksum varchar(128),
    applied_at timestamptz not null default now()
  )
`);

try {
  for (const [id, fileName] of migrations) {
    const applied = await sql.unsafe(
      `select id from app_private.schema_migrations where id = '${escapeSqlLiteral(id)}' limit 1`,
    );

    if (applied.length > 0) {
      console.log(`skip ${id}`);
      continue;
    }

    const migrationSql = await readFile(path.join(migrationsDir, fileName), "utf8");

    await sql.begin(async (tx) => {
      await tx.unsafe(migrationSql);
      await tx.unsafe(`
        insert into app_private.schema_migrations (id, file_name)
        values ('${escapeSqlLiteral(id)}', '${escapeSqlLiteral(fileName)}')
      `);
    });

    console.log(`applied ${id}`);
  }
} finally {
  await sql.end();
}

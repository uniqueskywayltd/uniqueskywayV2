import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export interface DatabaseConnection {
  db: ReturnType<typeof createDrizzleClient>;
  sql: ReturnType<typeof postgres>;
  close(): Promise<void>;
}

function createDrizzleClient(sql: ReturnType<typeof postgres>) {
  return drizzle(sql, { schema });
}

export function createDatabaseConnection(connectionString: string): DatabaseConnection {
  const sql = postgres(connectionString, {
    max: 10,
    prepare: false,
  });

  const db = createDrizzleClient(sql);

  return {
    db,
    sql,
    close: () => sql.end(),
  };
}

import "server-only";

import { getServerEnv } from "@/config/server-env";

import { createDatabaseConnection } from "./client";
import type { DatabaseConnection } from "./client";

let connection: DatabaseConnection | undefined;

export function getDatabaseConnection(): DatabaseConnection {
  connection ??= createDatabaseConnection(getServerEnv().DATABASE_URL);
  return connection;
}

import { pgSchema } from "drizzle-orm/pg-core";

export const appPrivate = pgSchema("app_private");
export const auditSchema = pgSchema("audit");

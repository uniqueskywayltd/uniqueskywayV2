export interface DatabaseMigration {
  id: string;
  phase:
    | "identity"
    | "core"
    | "financial"
    | "notifications"
    | "admin"
    | "indexes"
    | "seed"
    | "customer_experience";
  fileName: string;
}

export const databaseMigrations = [
  {
    id: "202607120301_identity",
    phase: "identity",
    fileName: "202607120301_identity.sql",
  },
  {
    id: "202607120302_core",
    phase: "core",
    fileName: "202607120302_core.sql",
  },
  {
    id: "202607120303_financial",
    phase: "financial",
    fileName: "202607120303_financial.sql",
  },
  {
    id: "202607120304_notifications",
    phase: "notifications",
    fileName: "202607120304_notifications.sql",
  },
  {
    id: "202607120305_admin",
    phase: "admin",
    fileName: "202607120305_admin.sql",
  },
  {
    id: "202607120306_indexes",
    phase: "indexes",
    fileName: "202607120306_indexes.sql",
  },
  {
    id: "202607120307_seed",
    phase: "seed",
    fileName: "202607120307_seed.sql",
  },
  {
    id: "202607130501_customer_experience",
    phase: "customer_experience",
    fileName: "202607130501_customer_experience.sql",
  },
] as const satisfies readonly DatabaseMigration[];

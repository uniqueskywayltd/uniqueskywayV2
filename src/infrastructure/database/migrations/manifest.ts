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
    | "customer_experience"
    | "investment_engine"
    | "deposit_engine"
    | "money_movement"
    | "admin_platform";
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
  {
    id: "202607130601_investment_engine",
    phase: "investment_engine",
    fileName: "202607130601_investment_engine.sql",
  },
  {
    id: "202607130701_deposit_engine",
    phase: "deposit_engine",
    fileName: "202607130701_deposit_engine.sql",
  },
  {
    id: "202607130702_money_movement",
    phase: "money_movement",
    fileName: "202607130702_money_movement.sql",
  },
  {
    id: "202607130801_admin_customer_notes",
    phase: "admin_platform",
    fileName: "202607130801_admin_customer_notes.sql",
  },
  {
    id: "202607130802_admin_financial_ops",
    phase: "admin_platform",
    fileName: "202607130802_admin_financial_ops.sql",
  },
  {
    id: "202607130803_admin_rbac_system",
    phase: "admin_platform",
    fileName: "202607130803_admin_rbac_system.sql",
  },
] as const satisfies readonly DatabaseMigration[];

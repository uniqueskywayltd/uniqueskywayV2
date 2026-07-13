import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { databaseMigrations } from ".";

async function readMigrationSql(fileName: string) {
  return readFile(path.join(process.cwd(), "supabase", "migrations", fileName), "utf8");
}

describe("database constraints and integrity migrations", () => {
  it("splits migrations into logical files instead of one giant migration", () => {
    expect(databaseMigrations).toHaveLength(8);
    expect(databaseMigrations.map((migration) => migration.fileName)).toEqual([
      "202607120301_identity.sql",
      "202607120302_core.sql",
      "202607120303_financial.sql",
      "202607120304_notifications.sql",
      "202607120305_admin.sql",
      "202607120306_indexes.sql",
      "202607120307_seed.sql",
      "202607130501_customer_experience.sql",
    ]);
  });

  it("enforces ledger immutability, balance, idempotency, and wallet projections", async () => {
    const sql = await readMigrationSql("202607120303_financial.sql");

    expect(sql).toContain("ledger_transactions_idempotency_key_uidx");
    expect(sql).toContain("ledger_entries_amount_positive_chk");
    expect(sql).toContain("ledger_entries_balance_ctr");
    expect(sql).toContain("ledger_transactions_entries_ctr");
    expect(sql).toContain("ledger_entries_immutable_trg");
    expect(sql).toContain("ledger_transactions_immutable_trg");
    expect(sql).toContain("create view public.ledger_account_balances");
    expect(sql).toContain("create view public.wallet_balances");
  });

  it("enforces ROI, settlement, withdrawal, referral, and audit constraints", async () => {
    const financialSql = await readMigrationSql("202607120303_financial.sql");
    const adminSql = await readMigrationSql("202607120305_admin.sql");

    expect(financialSql).toContain("investments_activation_fields_chk");
    expect(financialSql).toContain("roi_schedule_items_investment_earning_date_uidx");
    expect(financialSql).toContain("settlement_items_investment_date_uidx");
    expect(financialSql).toContain("settlement_items_posted_requires_ledger_chk");
    expect(financialSql).toContain("roi_ledger_entries_immutable_trg");
    expect(financialSql).toContain("withdrawal_requests_review_reason_chk");
    expect(financialSql).toContain("referrals_no_self_referral_chk");
    expect(financialSql).toContain("referral_rewards_posted_requires_ledger_chk");
    expect(adminSql).toContain("audit_logs_admin_financial_reason_chk");
    expect(adminSql).toContain("audit_logs_immutable_trg");
  });

  it("sets a deny-by-default RLS baseline with customer read policies", async () => {
    const sql = await readMigrationSql("202607120305_admin.sql");

    expect(sql).toContain("alter table public.users enable row level security");
    expect(sql).toContain("alter table public.ledger_entries enable row level security");
    expect(sql).toContain("users_select_own");
    expect(sql).toContain("wallets_select_own");
    expect(sql).toContain("investments_select_own");
    expect(sql).toContain("notifications_select_own");
  });

  it("adds customer experience preferences and avatar metadata without financial tables", async () => {
    const sql = await readMigrationSql("202607130501_customer_experience.sql");

    expect(sql).toContain("alter table public.customer_profiles");
    expect(sql).toContain("create table public.customer_preferences");
    expect(sql).toContain("customer_preferences_select_own");
    expect(sql).not.toContain("ledger_entries");
    expect(sql).not.toContain("wallet_balances");
    expect(sql).not.toContain("investments");
  });
});

import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { databaseMigrations } from ".";

async function readMigrationSql(fileName: string) {
  return readFile(path.join(process.cwd(), "supabase", "migrations", fileName), "utf8");
}

describe("database constraints and integrity migrations", () => {
  it("splits migrations into logical files instead of one giant migration", () => {
    expect(databaseMigrations).toHaveLength(13);
    expect(databaseMigrations.map((migration) => migration.fileName)).toEqual([
      "202607120301_identity.sql",
      "202607120302_core.sql",
      "202607120303_financial.sql",
      "202607120304_notifications.sql",
      "202607120305_admin.sql",
      "202607120306_indexes.sql",
      "202607120307_seed.sql",
      "202607130501_customer_experience.sql",
      "202607130601_investment_engine.sql",
      "202607130701_deposit_engine.sql",
      "202607130702_money_movement.sql",
      "202607130801_admin_customer_notes.sql",
      "202607130802_admin_financial_ops.sql",
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

  it("adds Phase 6 investment engine snapshot and settlement explanation fields", async () => {
    const sql = await readMigrationSql("202607130601_investment_engine.sql");

    expect(sql).toContain("promised_roi_minor");
    expect(sql).toContain("principal_return_policy");
    expect(sql).toContain("investments_idempotency_key_uidx");
    expect(sql).toContain(
      "rename column rounding_residual_micro_minor to next_residual_micro_minor",
    );
    expect(sql).toContain("previous_residual_micro_minor");
    expect(sql).toContain("calculation_version");
    expect(sql).not.toContain("deposit_intents");
    expect(sql).not.toContain("withdrawal_requests");
  });

  it("adds Phase 7.1 deposit engine provider replay and ledger references", async () => {
    const sql = await readMigrationSql("202607130701_deposit_engine.sql");

    expect(sql).toContain("provider_authorization_url");
    expect(sql).toContain("confirmation_ledger_transaction_id");
    expect(sql).toContain("deposit_intents_confirmation_ledger_transaction_uidx");
    expect(sql).toContain("payment_provider_events");
    expect(sql).toContain("payload jsonb");
    expect(sql).not.toContain("withdrawal_requests");
  });

  it("adds Phase 7.2 withdrawal payout fields and provider-event retry columns", async () => {
    const sql = await readMigrationSql("202607130702_money_movement.sql");

    expect(sql).toContain("provider_payout_reference");
    expect(sql).toContain("reservation_ledger_transaction_id");
    expect(sql).toContain("payment_ledger_transaction_id");
    expect(sql).toContain("release_ledger_transaction_id");
    expect(sql).toContain("attempt_count");
    expect(sql).toContain("dead_lettered_at");
    expect(sql).toContain("payment_provider_events_retry_idx");
  });

  it("adds Phase 8.1 customer notes with a deny-by-default RLS baseline", async () => {
    const sql = await readMigrationSql("202607130801_admin_customer_notes.sql");

    expect(sql).toContain("create table public.customer_notes");
    expect(sql).toContain("customer_notes_body_not_blank_chk");
    expect(sql).toContain("customer_notes_user_id_created_idx");
    expect(sql).toContain("alter table public.customer_notes enable row level security");
    expect(sql).not.toContain("create policy");
    expect(sql).not.toContain("deposit_intents");
    expect(sql).not.toContain("withdrawal_requests");
    expect(sql).not.toContain("ledger_entries");
  });

  it("adds Phase 8.2 admin financial ops notes with a deny-by-default RLS baseline", async () => {
    const sql = await readMigrationSql("202607130802_admin_financial_ops.sql");

    expect(sql).toContain("create table public.admin_entity_notes");
    expect(sql).toContain("admin_entity_notes_body_not_blank_chk");
    expect(sql).toContain("admin_entity_notes_target_created_idx");
    expect(sql).toContain("alter table public.admin_entity_notes enable row level security");
    expect(sql).not.toContain("create policy");
    expect(sql).not.toContain("deposit_intents");
    expect(sql).not.toContain("withdrawal_requests");
    expect(sql).not.toContain("ledger_entries");
  });
});

import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import {
  accountBalanceSnapshots,
  adminEntityNotes,
  auditLogs,
  backgroundJobs,
  customerAccounts,
  customerNotes,
  customerProfiles,
  depositIntents,
  emailMessages,
  featureFlags,
  investmentPlans,
  investmentPlanVersions,
  investments,
  ledgerAccounts,
  ledgerEntries,
  ledgerTransactions,
  notificationDeliveries,
  notifications,
  outboxEvents,
  paymentProviderEvents,
  referralCodes,
  referralRewards,
  referrals,
  roiLedgerEntries,
  roiScheduleItems,
  securityEvents,
  sessions,
  settlementItems,
  settlementRuns,
  systemSettings,
  trustedDevices,
  users,
  wallets,
  withdrawalRequests,
} from ".";

describe("database schema", () => {
  it("exports the required Phase 3 tables", () => {
    expect(getTableName(users)).toBe("users");
    expect(getTableName(customerProfiles)).toBe("customer_profiles");
    expect(getTableName(customerAccounts)).toBe("customer_accounts");
    expect(getTableName(customerNotes)).toBe("customer_notes");
    expect(getTableName(adminEntityNotes)).toBe("admin_entity_notes");
    expect(getTableName(wallets)).toBe("wallets");
    expect(getTableName(ledgerAccounts)).toBe("ledger_accounts");
    expect(getTableName(ledgerTransactions)).toBe("ledger_transactions");
    expect(getTableName(ledgerEntries)).toBe("ledger_entries");
    expect(getTableName(accountBalanceSnapshots)).toBe("account_balance_snapshots");
    expect(getTableName(investmentPlans)).toBe("investment_plans");
    expect(getTableName(investmentPlanVersions)).toBe("investment_plan_versions");
    expect(getTableName(investments)).toBe("investments");
    expect(getTableName(roiScheduleItems)).toBe("roi_schedule_items");
    expect(getTableName(roiLedgerEntries)).toBe("roi_ledger_entries");
    expect(getTableName(depositIntents)).toBe("deposit_intents");
    expect(getTableName(withdrawalRequests)).toBe("withdrawal_requests");
    expect(getTableName(paymentProviderEvents)).toBe("payment_provider_events");
    expect(getTableName(settlementRuns)).toBe("settlement_runs");
    expect(getTableName(settlementItems)).toBe("settlement_items");
    expect(getTableName(referralCodes)).toBe("referral_codes");
    expect(getTableName(referrals)).toBe("referrals");
    expect(getTableName(referralRewards)).toBe("referral_rewards");
    expect(getTableName(notifications)).toBe("notifications");
    expect(getTableName(notificationDeliveries)).toBe("notification_deliveries");
    expect(getTableName(emailMessages)).toBe("email_messages");
    expect(getTableName(outboxEvents)).toBe("outbox_events");
    expect(getTableName(auditLogs)).toBe("audit_logs");
    expect(getTableName(securityEvents)).toBe("security_events");
    expect(getTableName(backgroundJobs)).toBe("background_jobs");
    expect(getTableName(systemSettings)).toBe("system_settings");
    expect(getTableName(featureFlags)).toBe("feature_flags");
    expect(getTableName(trustedDevices)).toBe("trusted_devices");
    expect(getTableName(sessions)).toBe("sessions");
  });
});

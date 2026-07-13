import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { investmentPlanVersions } from "./core";
import {
  depositStatusEnum,
  investmentStatusEnum,
  ledgerAccountStatusEnum,
  ledgerAccountTypeEnum,
  ledgerDirectionEnum,
  ledgerOwnerTypeEnum,
  ledgerTransactionTypeEnum,
  paymentProviderEventStatusEnum,
  principalReturnPolicyEnum,
  referralCodeStatusEnum,
  referralRewardStatusEnum,
  referralStatusEnum,
  roiLedgerStatusEnum,
  roiScheduleStatusEnum,
  settlementItemStatusEnum,
  settlementRunStatusEnum,
  settlementRunTypeEnum,
  walletAccountCategoryEnum,
  walletStatusEnum,
  withdrawalStatusEnum,
} from "./enums";
import { users } from "./identity";

export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    currency: varchar("currency", { length: 3 }).notNull(),
    status: walletStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("wallets_user_currency_uidx").on(table.userId, table.currency),
    index("wallets_user_id_idx").on(table.userId),
    index("wallets_status_idx").on(table.status),
  ],
);

export const ledgerAccounts = pgTable(
  "ledger_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerType: ledgerOwnerTypeEnum("owner_type").notNull(),
    ownerId: varchar("owner_id", { length: 120 }).notNull(),
    accountType: ledgerAccountTypeEnum("account_type").notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    status: ledgerAccountStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ledger_accounts_owner_type_currency_uidx").on(
      table.ownerType,
      table.ownerId,
      table.accountType,
      table.currency,
    ),
    index("ledger_accounts_owner_idx").on(table.ownerType, table.ownerId),
    index("ledger_accounts_type_idx").on(table.accountType),
  ],
);

export const walletAccountLinks = pgTable(
  "wallet_account_links",
  {
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade" }),
    ledgerAccountId: uuid("ledger_account_id")
      .notNull()
      .references(() => ledgerAccounts.id, { onDelete: "restrict" }),
    category: walletAccountCategoryEnum("category").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("wallet_account_links_wallet_category_uidx").on(table.walletId, table.category),
    uniqueIndex("wallet_account_links_ledger_account_uidx").on(table.ledgerAccountId),
    index("wallet_account_links_wallet_id_idx").on(table.walletId),
  ],
);

export const ledgerTransactions = pgTable(
  "ledger_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    transactionType: ledgerTransactionTypeEnum("transaction_type").notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 180 }),
    referenceType: varchar("reference_type", { length: 80 }).notNull(),
    referenceId: varchar("reference_id", { length: 120 }).notNull(),
    description: text("description"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    postedAt: timestamp("posted_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ledger_transactions_idempotency_key_uidx").on(table.idempotencyKey),
    index("ledger_transactions_reference_idx").on(table.referenceType, table.referenceId),
    index("ledger_transactions_posted_at_idx").on(table.postedAt),
    index("ledger_transactions_type_idx").on(table.transactionType),
  ],
);

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ledgerTransactionId: uuid("ledger_transaction_id")
      .notNull()
      .references(() => ledgerTransactions.id, { onDelete: "restrict" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => ledgerAccounts.id, { onDelete: "restrict" }),
    direction: ledgerDirectionEnum("direction").notNull(),
    amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("ledger_entries_account_id_idx").on(table.accountId),
    index("ledger_entries_transaction_id_idx").on(table.ledgerTransactionId),
    index("ledger_entries_created_at_idx").on(table.createdAt),
  ],
);

export const accountBalanceSnapshots = pgTable(
  "account_balance_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => ledgerAccounts.id, { onDelete: "restrict" }),
    balanceMinor: bigint("balance_minor", { mode: "bigint" }).notNull(),
    asOfLedgerEntryId: uuid("as_of_ledger_entry_id")
      .notNull()
      .references(() => ledgerEntries.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("account_balance_snapshots_account_entry_uidx").on(
      table.accountId,
      table.asOfLedgerEntryId,
    ),
    index("account_balance_snapshots_account_created_idx").on(table.accountId, table.createdAt),
  ],
);

export const investments = pgTable(
  "investments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    planVersionId: uuid("plan_version_id")
      .notNull()
      .references(() => investmentPlanVersions.id, { onDelete: "restrict" }),
    currency: varchar("currency", { length: 3 }).notNull(),
    principalMinor: bigint("principal_minor", { mode: "bigint" }).notNull(),
    dailyRoiBps: integer("daily_roi_bps").notNull(),
    totalRoiBps: integer("total_roi_bps"),
    promisedRoiMinor: bigint("promised_roi_minor", { mode: "bigint" }),
    termDays: integer("term_days").notNull(),
    principalReturnPolicy: principalReturnPolicyEnum("principal_return_policy")
      .notNull()
      .default("return_at_maturity"),
    calculationVersion: varchar("calculation_version", { length: 40 }).notNull().default("roi-v1"),
    idempotencyKey: varchar("idempotency_key", { length: 180 }),
    startAt: timestamp("start_at", { withTimezone: true }),
    firstSettlementDate: date("first_settlement_date"),
    maturityDate: date("maturity_date"),
    status: investmentStatusEnum("status").notNull().default("pending"),
    roundingResidualMicroMinor: bigint("rounding_residual_micro_minor", { mode: "bigint" })
      .notNull()
      .default(0n),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    maturedAt: timestamp("matured_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    fundingLedgerTransactionId: uuid("funding_ledger_transaction_id").references(
      () => ledgerTransactions.id,
      { onDelete: "restrict" },
    ),
    maturityLedgerTransactionId: uuid("maturity_ledger_transaction_id").references(
      () => ledgerTransactions.id,
      { onDelete: "restrict" },
    ),
  },
  (table) => [
    uniqueIndex("investments_idempotency_key_uidx").on(table.idempotencyKey),
    index("investments_user_id_idx").on(table.userId),
    index("investments_status_idx").on(table.status),
    index("investments_maturity_date_idx").on(table.maturityDate),
    index("investments_first_settlement_date_idx").on(table.firstSettlementDate),
    index("investments_active_settlement_idx").on(
      table.status,
      table.firstSettlementDate,
      table.maturityDate,
    ),
  ],
);

export const roiScheduleItems = pgTable(
  "roi_schedule_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    investmentId: uuid("investment_id")
      .notNull()
      .references(() => investments.id, { onDelete: "restrict" }),
    sequenceNumber: integer("sequence_number").notNull(),
    earningDate: date("earning_date").notNull(),
    settlementDate: date("settlement_date").notNull(),
    expectedRoiMicroMinor: bigint("expected_roi_micro_minor", { mode: "bigint" }).notNull(),
    status: roiScheduleStatusEnum("status").notNull().default("scheduled"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    postedAt: timestamp("posted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("roi_schedule_items_investment_sequence_uidx").on(
      table.investmentId,
      table.sequenceNumber,
    ),
    uniqueIndex("roi_schedule_items_investment_earning_date_uidx").on(
      table.investmentId,
      table.earningDate,
    ),
    index("roi_schedule_items_due_idx").on(table.status, table.settlementDate),
  ],
);

export const depositIntents = pgTable(
  "deposit_intents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    provider: varchar("provider", { length: 80 }).notNull(),
    providerIntentId: varchar("provider_intent_id", { length: 180 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
    status: depositStatusEnum("status").notNull().default("created"),
    idempotencyKey: varchar("idempotency_key", { length: 180 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("deposit_intents_provider_intent_uidx").on(table.provider, table.providerIntentId),
    uniqueIndex("deposit_intents_idempotency_key_uidx").on(table.idempotencyKey),
    index("deposit_intents_user_id_idx").on(table.userId),
    index("deposit_intents_status_idx").on(table.status),
  ],
);

export const withdrawalRequests = pgTable(
  "withdrawal_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    currency: varchar("currency", { length: 3 }).notNull(),
    amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
    destinationType: varchar("destination_type", { length: 80 }).notNull(),
    destinationReference: varchar("destination_reference", { length: 240 }).notNull(),
    status: withdrawalStatusEnum("status").notNull().default("requested"),
    riskScore: integer("risk_score"),
    reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewReason: text("review_reason"),
    idempotencyKey: varchar("idempotency_key", { length: 180 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("withdrawal_requests_idempotency_key_uidx").on(table.idempotencyKey),
    index("withdrawal_requests_user_id_idx").on(table.userId),
    index("withdrawal_requests_status_idx").on(table.status),
    index("withdrawal_requests_created_at_idx").on(table.createdAt),
  ],
);

export const paymentProviderEvents = pgTable(
  "payment_provider_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: varchar("provider", { length: 80 }).notNull(),
    providerEventId: varchar("provider_event_id", { length: 180 }).notNull(),
    eventType: varchar("event_type", { length: 160 }).notNull(),
    payloadHash: varchar("payload_hash", { length: 128 }).notNull(),
    status: paymentProviderEventStatusEnum("status").notNull().default("received"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    errorMessage: text("error_message"),
  },
  (table) => [
    uniqueIndex("payment_provider_events_provider_event_uidx").on(
      table.provider,
      table.providerEventId,
    ),
    index("payment_provider_events_status_idx").on(table.status),
    index("payment_provider_events_received_at_idx").on(table.receivedAt),
  ],
);

export const settlementRuns = pgTable(
  "settlement_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    settlementDate: date("settlement_date").notNull(),
    runType: settlementRunTypeEnum("run_type").notNull(),
    status: settlementRunStatusEnum("status").notNull().default("pending"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    lockedBy: varchar("locked_by", { length: 160 }),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("settlement_runs_date_idx").on(table.settlementDate),
    index("settlement_runs_status_idx").on(table.status),
    uniqueIndex("settlement_runs_active_date_uidx")
      .on(table.settlementDate)
      .where(sql`${table.status} in ('pending', 'running')`),
    uniqueIndex("settlement_runs_success_date_type_uidx")
      .on(table.settlementDate, table.runType)
      .where(sql`${table.status} = 'completed'`),
  ],
);

export const settlementItems = pgTable(
  "settlement_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    settlementRunId: uuid("settlement_run_id")
      .notNull()
      .references(() => settlementRuns.id, { onDelete: "restrict" }),
    investmentId: uuid("investment_id")
      .notNull()
      .references(() => investments.id, { onDelete: "restrict" }),
    earningDate: date("earning_date").notNull(),
    settlementDate: date("settlement_date").notNull(),
    grossRoiMicroMinor: bigint("gross_roi_micro_minor", { mode: "bigint" }).notNull(),
    previousResidualMicroMinor: bigint("previous_residual_micro_minor", {
      mode: "bigint",
    }).notNull(),
    postedRoiMinor: bigint("posted_roi_minor", { mode: "bigint" }).notNull(),
    nextResidualMicroMinor: bigint("next_residual_micro_minor", {
      mode: "bigint",
    }).notNull(),
    calculationVersion: varchar("calculation_version", { length: 40 }).notNull().default("roi-v1"),
    ledgerTransactionId: uuid("ledger_transaction_id").references(() => ledgerTransactions.id, {
      onDelete: "restrict",
    }),
    status: settlementItemStatusEnum("status").notNull(),
    reason: text("reason"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("settlement_items_investment_date_uidx").on(
      table.investmentId,
      table.settlementDate,
    ),
    index("settlement_items_investment_id_idx").on(table.investmentId),
    index("settlement_items_settlement_date_idx").on(table.settlementDate),
    index("settlement_items_run_id_idx").on(table.settlementRunId),
  ],
);

export const roiLedgerEntries = pgTable(
  "roi_ledger_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    investmentId: uuid("investment_id")
      .notNull()
      .references(() => investments.id, { onDelete: "restrict" }),
    settlementItemId: uuid("settlement_item_id")
      .notNull()
      .references(() => settlementItems.id, { onDelete: "restrict" }),
    earningDate: date("earning_date").notNull(),
    settlementDate: date("settlement_date").notNull(),
    principalMinor: bigint("principal_minor", { mode: "bigint" }).notNull(),
    dailyRoiBps: integer("daily_roi_bps").notNull(),
    grossRoiMicroMinor: bigint("gross_roi_micro_minor", { mode: "bigint" }).notNull(),
    previousResidualMicroMinor: bigint("previous_residual_micro_minor", {
      mode: "bigint",
    }).notNull(),
    postedRoiMinor: bigint("posted_roi_minor", { mode: "bigint" }).notNull(),
    nextResidualMicroMinor: bigint("next_residual_micro_minor", { mode: "bigint" }).notNull(),
    ledgerTransactionId: uuid("ledger_transaction_id")
      .notNull()
      .references(() => ledgerTransactions.id, { onDelete: "restrict" }),
    calculationVersion: varchar("calculation_version", { length: 40 }).notNull().default("roi-v1"),
    status: roiLedgerStatusEnum("status").notNull().default("posted"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("roi_ledger_entries_investment_earning_date_uidx").on(
      table.investmentId,
      table.earningDate,
    ),
    uniqueIndex("roi_ledger_entries_settlement_item_uidx").on(table.settlementItemId),
    index("roi_ledger_entries_settlement_date_idx").on(table.settlementDate),
  ],
);

export const referralCodes = pgTable(
  "referral_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 40 }).notNull(),
    status: referralCodeStatusEnum("status").notNull().default("active"),
    isDefault: boolean("is_default").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("referral_codes_code_uidx").on(table.code),
    uniqueIndex("referral_codes_default_user_uidx")
      .on(table.userId)
      .where(sql`${table.isDefault} is true and ${table.status} = 'active'`),
    index("referral_codes_user_id_idx").on(table.userId),
  ],
);

export const referrals = pgTable(
  "referrals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    referrerUserId: uuid("referrer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    referredUserId: uuid("referred_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    referralCodeId: uuid("referral_code_id")
      .notNull()
      .references(() => referralCodes.id, { onDelete: "restrict" }),
    status: referralStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    qualifiedAt: timestamp("qualified_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("referrals_referred_user_id_uidx").on(table.referredUserId),
    index("referrals_referrer_user_id_idx").on(table.referrerUserId),
    index("referrals_status_idx").on(table.status),
  ],
);

export const referralRewards = pgTable(
  "referral_rewards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    referralId: uuid("referral_id")
      .notNull()
      .references(() => referrals.id, { onDelete: "restrict" }),
    investmentId: uuid("investment_id")
      .notNull()
      .references(() => investments.id, { onDelete: "restrict" }),
    currency: varchar("currency", { length: 3 }).notNull(),
    amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
    status: referralRewardStatusEnum("status").notNull().default("pending"),
    ledgerTransactionId: uuid("ledger_transaction_id").references(() => ledgerTransactions.id, {
      onDelete: "restrict",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    postedAt: timestamp("posted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("referral_rewards_referral_investment_uidx").on(
      table.referralId,
      table.investmentId,
    ),
    index("referral_rewards_status_idx").on(table.status),
  ],
);

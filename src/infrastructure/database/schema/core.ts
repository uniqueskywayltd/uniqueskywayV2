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

import {
  accountStatusEnum,
  earlyExitPolicyEnum,
  investmentPlanStatusEnum,
  kycStatusEnum,
  onboardingStatusEnum,
  planVersionStatusEnum,
  principalReturnPolicyEnum,
  riskStatusEnum,
} from "./enums";
import { users } from "./identity";

export const customerProfiles = pgTable(
  "customer_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    legalName: varchar("legal_name", { length: 200 }),
    displayName: varchar("display_name", { length: 120 }),
    phone: varchar("phone", { length: 40 }),
    country: varchar("country", { length: 2 }),
    stateRegion: varchar("state_region", { length: 80 }),
    dateOfBirth: date("date_of_birth"),
    avatarStoragePath: varchar("avatar_storage_path", { length: 500 }),
    avatarContentType: varchar("avatar_content_type", { length: 80 }),
    avatarUpdatedAt: timestamp("avatar_updated_at", { withTimezone: true }),
    onboardingStatus: onboardingStatusEnum("onboarding_status").notNull().default("not_started"),
    kycStatus: kycStatusEnum("kyc_status").notNull().default("not_started"),
    riskStatus: riskStatusEnum("risk_status").notNull().default("not_reviewed"),
    termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
    termsVersion: varchar("terms_version", { length: 40 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("customer_profiles_user_id_uidx").on(table.userId),
    index("customer_profiles_kyc_status_idx").on(table.kycStatus),
    index("customer_profiles_risk_status_idx").on(table.riskStatus),
  ],
);

export const customerPreferences = pgTable(
  "customer_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    appearance: varchar("appearance", { length: 20 }).notNull().default("system"),
    language: varchar("language", { length: 16 }).notNull().default("en"),
    timeZone: varchar("time_zone", { length: 80 }).notNull().default("America/New_York"),
    inAppNotificationsEnabled: boolean("in_app_notifications_enabled").notNull().default(true),
    securityEmailsEnabled: boolean("security_emails_enabled").notNull().default(true),
    productEmailsEnabled: boolean("product_emails_enabled").notNull().default(true),
    marketingEmailsEnabled: boolean("marketing_emails_enabled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("customer_preferences_user_id_uidx").on(table.userId),
    index("customer_preferences_time_zone_idx").on(table.timeZone),
  ],
);

export const customerAccounts = pgTable(
  "customer_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    accountNumber: varchar("account_number", { length: 40 }).notNull(),
    status: accountStatusEnum("status").notNull().default("active"),
    restrictionReason: varchar("restriction_reason", { length: 500 }),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("customer_accounts_user_id_uidx").on(table.userId),
    uniqueIndex("customer_accounts_account_number_uidx").on(table.accountNumber),
    index("customer_accounts_status_idx").on(table.status),
  ],
);

export const investmentPlans = pgTable(
  "investment_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description"),
    status: investmentPlanStatusEnum("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("investment_plans_slug_uidx").on(table.slug),
    index("investment_plans_status_idx").on(table.status),
  ],
);

export const customerNotes = pgTable(
  "customer_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("customer_notes_user_id_created_idx").on(table.userId, table.createdAt.desc())],
);

export const investmentPlanVersions = pgTable(
  "investment_plan_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => investmentPlans.id, { onDelete: "restrict" }),
    version: integer("version").notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    minPrincipalMinor: bigint("min_principal_minor", { mode: "bigint" }).notNull(),
    maxPrincipalMinor: bigint("max_principal_minor", { mode: "bigint" }).notNull(),
    termDays: integer("term_days").notNull(),
    dailyRoiBps: integer("daily_roi_bps").notNull(),
    totalRoiBps: integer("total_roi_bps"),
    principalReturnPolicy: principalReturnPolicyEnum("principal_return_policy").notNull(),
    earlyExitPolicy: earlyExitPolicyEnum("early_exit_policy").notNull().default("not_allowed"),
    referralRewardPolicyId: uuid("referral_reward_policy_id"),
    effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull(),
    effectiveTo: timestamp("effective_to", { withTimezone: true }),
    status: planVersionStatusEnum("status").notNull().default("draft"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("investment_plan_versions_plan_version_uidx").on(table.planId, table.version),
    index("investment_plan_versions_plan_id_idx").on(table.planId),
    index("investment_plan_versions_status_idx").on(table.status),
    index("investment_plan_versions_effective_idx").on(table.effectiveFrom, table.effectiveTo),
  ],
);

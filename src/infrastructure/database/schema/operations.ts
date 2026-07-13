import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import {
  auditActorTypeEnum,
  backgroundJobStatusEnum,
  featureFlagStatusEnum,
  securitySeverityEnum,
} from "./enums";
import { users } from "./identity";
import { appPrivate, auditSchema } from "./namespaces";

export const systemSettings = appPrivate.table(
  "system_settings",
  {
    key: varchar("key", { length: 120 }).primaryKey(),
    value: jsonb("value").$type<Record<string, unknown>>().notNull(),
    description: text("description"),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("system_settings_updated_at_idx").on(table.updatedAt)],
);

export const featureFlags = appPrivate.table(
  "feature_flags",
  {
    key: varchar("key", { length: 120 }).primaryKey(),
    status: featureFlagStatusEnum("status").notNull().default("disabled"),
    description: text("description"),
    rules: jsonb("rules")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("feature_flags_status_idx").on(table.status)],
);

export const backgroundJobs = appPrivate.table(
  "background_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobType: varchar("job_type", { length: 120 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 180 }).notNull(),
    payload: jsonb("payload")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    status: backgroundJobStatusEnum("status").notNull().default("pending"),
    attemptCount: integer("attempt_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    runAt: timestamp("run_at", { withTimezone: true }).notNull().defaultNow(),
    lockedBy: varchar("locked_by", { length: 160 }),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("background_jobs_idempotency_key_uidx").on(table.idempotencyKey),
    index("background_jobs_status_run_at_idx").on(table.status, table.runAt),
    index("background_jobs_type_status_idx").on(table.jobType, table.status),
  ],
);

export const auditLogs = auditSchema.table(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    actorType: auditActorTypeEnum("actor_type").notNull(),
    action: varchar("action", { length: 160 }).notNull(),
    targetType: varchar("target_type", { length: 100 }).notNull(),
    targetId: varchar("target_id", { length: 120 }).notNull(),
    reason: text("reason"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    requestId: varchar("request_id", { length: 120 }),
    ipAddressHash: varchar("ip_address_hash", { length: 128 }),
    userAgentHash: varchar("user_agent_hash", { length: 128 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_actor_idx").on(table.actorType, table.actorUserId),
    index("audit_logs_target_idx").on(table.targetType, table.targetId),
    index("audit_logs_created_at_idx").on(table.createdAt),
    index("audit_logs_action_idx").on(table.action),
  ],
);

export const securityEvents = auditSchema.table(
  "security_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    eventType: varchar("event_type", { length: 160 }).notNull(),
    severity: securitySeverityEnum("severity").notNull().default("info"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    ipAddressHash: varchar("ip_address_hash", { length: 128 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("security_events_user_id_idx").on(table.userId),
    index("security_events_type_idx").on(table.eventType),
    index("security_events_severity_idx").on(table.severity),
    index("security_events_created_at_idx").on(table.createdAt),
  ],
);

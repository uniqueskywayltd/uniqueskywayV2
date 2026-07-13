import { sql } from "drizzle-orm";
import {
  boolean,
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
  emailStatusEnum,
  notificationChannelEnum,
  notificationDeliveryStatusEnum,
  notificationPriorityEnum,
  outboxStatusEnum,
} from "./enums";
import { users } from "./identity";
import { appPrivate } from "./namespaces";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 120 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    body: text("body").notNull(),
    priority: notificationPriorityEnum("priority").notNull().default("info"),
    data: jsonb("data")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("notifications_user_id_created_at_idx").on(table.userId, table.createdAt),
    index("notifications_user_id_read_at_idx").on(table.userId, table.readAt),
    index("notifications_type_idx").on(table.type),
  ],
);

export const notificationChannelPreferences = pgTable(
  "notification_channel_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channel: notificationChannelEnum("channel").notNull(),
    topic: varchar("topic", { length: 120 }).notNull(),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("notification_channel_preferences_user_channel_topic_uidx").on(
      table.userId,
      table.channel,
      table.topic,
    ),
    index("notification_channel_preferences_user_id_idx").on(table.userId),
  ],
);

export const notificationDeliveries = appPrivate.table(
  "notification_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    notificationId: uuid("notification_id").references(() => notifications.id, {
      onDelete: "cascade",
    }),
    recipientUserId: uuid("recipient_user_id").references(() => users.id, { onDelete: "set null" }),
    channel: notificationChannelEnum("channel").notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 180 }).notNull(),
    providerMessageId: varchar("provider_message_id", { length: 180 }),
    status: notificationDeliveryStatusEnum("status").notNull().default("pending"),
    attemptCount: integer("attempt_count").notNull().default(0),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("notification_deliveries_idempotency_key_uidx").on(table.idempotencyKey),
    index("notification_deliveries_status_idx").on(table.status),
    index("notification_deliveries_notification_id_idx").on(table.notificationId),
  ],
);

export const emailMessages = appPrivate.table(
  "email_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipientUserId: uuid("recipient_user_id").references(() => users.id, { onDelete: "set null" }),
    toEmail: varchar("to_email", { length: 320 }).notNull(),
    templateKey: varchar("template_key", { length: 120 }).notNull(),
    templateVersion: varchar("template_version", { length: 40 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 180 }).notNull(),
    providerMessageId: varchar("provider_message_id", { length: 180 }),
    status: emailStatusEnum("status").notNull().default("queued"),
    attemptCount: integer("attempt_count").notNull().default(0),
    lastError: text("last_error"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("email_messages_idempotency_key_uidx").on(table.idempotencyKey),
    index("email_messages_user_id_idx").on(table.recipientUserId),
    index("email_messages_status_idx").on(table.status),
    index("email_messages_template_idx").on(table.templateKey, table.templateVersion),
  ],
);

export const outboxEvents = appPrivate.table(
  "outbox_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventType: varchar("event_type", { length: 160 }).notNull(),
    aggregateType: varchar("aggregate_type", { length: 100 }).notNull(),
    aggregateId: varchar("aggregate_id", { length: 120 }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    status: outboxStatusEnum("status").notNull().default("pending"),
    attemptCount: integer("attempt_count").notNull().default(0),
    availableAt: timestamp("available_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("outbox_events_status_available_idx").on(table.status, table.availableAt),
    index("outbox_events_aggregate_idx").on(table.aggregateType, table.aggregateId),
    index("outbox_events_event_type_idx").on(table.eventType),
  ],
);

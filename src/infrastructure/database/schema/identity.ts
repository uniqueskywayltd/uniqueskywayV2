import { sql } from "drizzle-orm";
import {
  index,
  pgTable,
  primaryKey,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { adminProfileStatusEnum, sessionStatusEnum, userStatusEnum } from "./enums";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authUserId: uuid("auth_user_id").notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    status: userStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_auth_user_id_uidx").on(table.authUserId),
    uniqueIndex("users_email_uidx").on(sql`lower(${table.email})`),
    index("users_status_idx").on(table.status),
  ],
);

export const adminProfiles = pgTable(
  "admin_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: adminProfileStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("admin_profiles_user_id_uidx").on(table.userId),
    index("admin_profiles_status_idx").on(table.status),
  ],
);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: varchar("key", { length: 80 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: varchar("description", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("roles_key_uidx").on(table.key)],
);

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    grantedBy: uuid("granted_by").references(() => users.id, { onDelete: "set null" }),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    primaryKey({ name: "user_roles_pk", columns: [table.userId, table.roleId, table.grantedAt] }),
    uniqueIndex("user_roles_active_uidx")
      .on(table.userId, table.roleId)
      .where(sql`${table.revokedAt} is null`),
    index("user_roles_user_id_idx").on(table.userId),
    index("user_roles_role_id_idx").on(table.roleId),
  ],
);

export const trustedDevices = pgTable(
  "trusted_devices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    deviceTokenHash: varchar("device_token_hash", { length: 128 }).notNull(),
    label: varchar("label", { length: 120 }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("trusted_devices_active_token_hash_uidx")
      .on(table.deviceTokenHash)
      .where(sql`${table.revokedAt} is null`),
    index("trusted_devices_user_id_idx").on(table.userId),
    index("trusted_devices_expires_at_idx").on(table.expiresAt),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    supabaseSessionId: varchar("supabase_session_id", { length: 160 }),
    sessionTokenHash: varchar("session_token_hash", { length: 128 }).notNull(),
    trustedDeviceId: uuid("trusted_device_id").references(() => trustedDevices.id, {
      onDelete: "set null",
    }),
    status: sessionStatusEnum("status").notNull().default("active"),
    stepUpVerifiedAt: timestamp("step_up_verified_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    ipAddressHash: varchar("ip_address_hash", { length: 128 }),
    userAgentHash: varchar("user_agent_hash", { length: 128 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_uidx").on(table.sessionTokenHash),
    uniqueIndex("sessions_supabase_session_id_uidx").on(table.supabaseSessionId),
    index("sessions_user_status_idx").on(table.userId, table.status),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { roles, users } from "./identity";

export const staffInviteStatusEnum = pgEnum("staff_invite_status", [
  "pending",
  "accepted",
  "revoked",
  "expired",
]);

export const templateChannelEnum = pgEnum("template_channel", [
  "email",
  "in_app",
  "sms",
  "push",
  "whatsapp",
]);

export const templateCatalogStatusEnum = pgEnum("template_catalog_status", [
  "enabled",
  "disabled",
]);

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: varchar("key", { length: 120 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    description: varchar("description", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("permissions_key_uidx").on(table.key)],
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    grantedBy: uuid("granted_by").references(() => users.id, { onDelete: "set null" }),
  },
  (table) => [
    primaryKey({ name: "role_permissions_pk", columns: [table.roleId, table.permissionId] }),
    index("role_permissions_permission_id_idx").on(table.permissionId),
  ],
);

export const staffInvites = pgTable(
  "staff_invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    status: staffInviteStatusEnum("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedUserId: uuid("accepted_user_id").references(() => users.id, { onDelete: "set null" }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("staff_invites_token_hash_uidx").on(table.tokenHash),
    index("staff_invites_email_status_idx").on(table.email, table.status),
    index("staff_invites_expires_at_idx").on(table.expiresAt),
  ],
);

export const staffInviteRoles = pgTable(
  "staff_invite_roles",
  {
    inviteId: uuid("invite_id")
      .notNull()
      .references(() => staffInvites.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
  },
  (table) => [
    primaryKey({ name: "staff_invite_roles_pk", columns: [table.inviteId, table.roleId] }),
  ],
);

export const emailTemplateCatalog = pgTable("email_template_catalog", {
  key: varchar("key", { length: 160 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: varchar("description", { length: 500 }),
  status: templateCatalogStatusEnum("status").notNull().default("enabled"),
  currentVersion: varchar("current_version", { length: 40 }).notNull().default("v1"),
  previewSample: jsonb("preview_sample")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationTemplateCatalog = pgTable("notification_template_catalog", {
  key: varchar("key", { length: 160 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: varchar("description", { length: 500 }),
  channel: templateChannelEnum("channel").notNull().default("in_app"),
  status: templateCatalogStatusEnum("status").notNull().default("enabled"),
  currentVersion: varchar("current_version", { length: 40 }).notNull().default("v1"),
  previewSample: jsonb("preview_sample")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

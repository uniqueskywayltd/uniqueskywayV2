import { and, desc, eq, gt, ilike, inArray, isNull, ne, sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import {
  adminProfiles,
  permissions,
  rolePermissions,
  roles,
  sessions,
  staffInviteRoles,
  staffInvites,
  trustedDevices,
  userRoles,
  users,
} from "../schema";
import type { DrizzleTransactionContext } from "../transactions";
import type { AppDatabaseExecutor } from "../types";
import { BaseDrizzleRepository, singleRow } from "./base-repository";

export type UserRecord = InferSelectModel<typeof users>;
export type NewUserRecord = InferInsertModel<typeof users>;
export type AdminProfileRecord = InferSelectModel<typeof adminProfiles>;
export type RoleRecord = InferSelectModel<typeof roles>;
export type PermissionRecord = InferSelectModel<typeof permissions>;
export type StaffInviteRecord = InferSelectModel<typeof staffInvites>;
export type TrustedDeviceRecord = InferSelectModel<typeof trustedDevices>;
export type SessionRecord = InferSelectModel<typeof sessions>;

export class IdentityRepository extends BaseDrizzleRepository {
  constructor(db: AppDatabaseExecutor) {
    super("identity", db);
  }

  protected clone(db: AppDatabaseExecutor): IdentityRepository {
    return new IdentityRepository(db);
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const rows = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async findUserByAuthUserId(authUserId: string): Promise<UserRecord | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.authUserId, authUserId))
      .limit(1);
    return rows[0] ?? null;
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    return rows[0] ?? null;
  }

  async createUser(context: DrizzleTransactionContext, values: NewUserRecord): Promise<UserRecord> {
    const rows = await context.db.insert(users).values(values).returning();
    return singleRow(rows, "createUser");
  }

  async ensureUser(context: DrizzleTransactionContext, values: NewUserRecord): Promise<UserRecord> {
    const rows = await context.db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.authUserId,
        set: {
          email: values.email,
          emailVerifiedAt: values.emailVerifiedAt,
          updatedAt: new Date(),
        },
      })
      .returning();

    return singleRow(rows, "ensureUser");
  }

  async markEmailVerified(
    context: DrizzleTransactionContext,
    userId: string,
    verifiedAt: Date,
  ): Promise<UserRecord> {
    const rows = await context.db
      .update(users)
      .set({ emailVerifiedAt: verifiedAt, updatedAt: verifiedAt })
      .where(eq(users.id, userId))
      .returning();

    return singleRow(rows, "markEmailVerified");
  }

  async updateUserStatus(
    context: DrizzleTransactionContext,
    userId: string,
    status: UserRecord["status"],
  ): Promise<UserRecord> {
    const rows = await context.db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    return singleRow(rows, "updateUserStatus");
  }

  /**
   * Hard-deletes a non-staff customer and all owned application data.
   * Runs `app_private.purge_customer_user` inside the current transaction.
   */
  async purgeCustomerUser(
    context: DrizzleTransactionContext,
    userId: string,
  ): Promise<{ authUserId: string; email: string }> {
    const rows = (await context.db.execute(sql`
      select
        auth_user_id as "authUserId",
        email
      from app_private.purge_customer_user(${userId}::uuid)
    `)) as unknown as Array<{ authUserId: string; email: string }>;

    const row = rows[0];
    if (!row?.authUserId || !row.email) {
      throw new Error("Customer purge did not return auth identity details.");
    }

    return { authUserId: row.authUserId, email: row.email };
  }

  async listRoles(): Promise<RoleRecord[]> {
    return this.db.select().from(roles);
  }

  async findAdminProfileByUserId(userId: string): Promise<AdminProfileRecord | null> {
    const rows = await this.db
      .select()
      .from(adminProfiles)
      .where(eq(adminProfiles.userId, userId))
      .limit(1);
    return rows[0] ?? null;
  }

  async listActiveRoleKeysForUser(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ key: roles.key })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(eq(userRoles.userId, userId), isNull(userRoles.revokedAt), eq(roles.status, "active")),
      );
    return rows.map((row) => row.key);
  }

  async listActivePermissionKeysForUser(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ key: permissions.key })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        and(eq(userRoles.userId, userId), isNull(userRoles.revokedAt), eq(roles.status, "active")),
      );
    return [...new Set(rows.map((row) => row.key))];
  }

  async listPermissions(): Promise<PermissionRecord[]> {
    return this.db.select().from(permissions).orderBy(permissions.key);
  }

  async findRoleById(roleId: string): Promise<RoleRecord | null> {
    const rows = await this.db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
    return rows[0] ?? null;
  }

  async findRoleByKey(key: string): Promise<RoleRecord | null> {
    const rows = await this.db.select().from(roles).where(eq(roles.key, key)).limit(1);
    return rows[0] ?? null;
  }

  async createRole(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof roles>,
  ): Promise<RoleRecord> {
    const rows = await context.db.insert(roles).values(values).returning();
    return singleRow(rows, "createRole");
  }

  async updateRole(
    context: DrizzleTransactionContext,
    roleId: string,
    values: Partial<Pick<RoleRecord, "name" | "description" | "status">>,
  ): Promise<RoleRecord> {
    const rows = await context.db
      .update(roles)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(roles.id, roleId))
      .returning();
    return singleRow(rows, "updateRole");
  }

  async listPermissionKeysForRole(roleId: string): Promise<string[]> {
    const rows = await this.db
      .select({ key: permissions.key })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));
    return rows.map((row) => row.key);
  }

  async replaceRolePermissions(
    context: DrizzleTransactionContext,
    roleId: string,
    permissionKeys: string[],
    grantedBy: string | null,
  ): Promise<void> {
    await context.db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    if (permissionKeys.length === 0) return;
    const permissionRows = await context.db
      .select()
      .from(permissions)
      .where(inArray(permissions.key, permissionKeys));
    if (permissionRows.length === 0) return;
    await context.db.insert(rolePermissions).values(
      permissionRows.map((permission) => ({
        roleId,
        permissionId: permission.id,
        grantedBy,
      })),
    );
  }

  async createAdminProfile(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof adminProfiles>,
  ): Promise<AdminProfileRecord> {
    const rows = await context.db.insert(adminProfiles).values(values).returning();
    return singleRow(rows, "createAdminProfile");
  }

  async updateAdminProfile(
    context: DrizzleTransactionContext,
    userId: string,
    values: Partial<
      Pick<
        AdminProfileRecord,
        "status" | "mustChangePassword" | "lastActiveAt" | "disabledAt" | "disabledReason"
      >
    >,
  ): Promise<AdminProfileRecord> {
    const rows = await context.db
      .update(adminProfiles)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(adminProfiles.userId, userId))
      .returning();
    return singleRow(rows, "updateAdminProfile");
  }

  async grantRole(
    context: DrizzleTransactionContext,
    values: {
      userId: string;
      roleId: string;
      grantedBy: string | null;
    },
  ): Promise<void> {
    await context.db.insert(userRoles).values({
      userId: values.userId,
      roleId: values.roleId,
      grantedBy: values.grantedBy,
    });
  }

  async revokeRole(
    context: DrizzleTransactionContext,
    userId: string,
    roleId: string,
  ): Promise<void> {
    await context.db
      .update(userRoles)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.roleId, roleId),
          isNull(userRoles.revokedAt),
        ),
      );
  }

  async listStaff(input: { q?: string; status?: string; limit?: number } = {}) {
    const limit = input.limit ?? 50;
    const filters = [];
    if (input.status) filters.push(eq(adminProfiles.status, input.status as never));
    if (input.q?.trim()) {
      const pattern = `%${input.q.trim()}%`;
      filters.push(ilike(users.email, pattern));
    }
    return this.db
      .select({
        user: users,
        adminProfile: adminProfiles,
      })
      .from(adminProfiles)
      .innerJoin(users, eq(adminProfiles.userId, users.id))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(adminProfiles.createdAt))
      .limit(limit);
  }

  async createStaffInvite(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof staffInvites>,
    roleIds: string[],
  ): Promise<StaffInviteRecord> {
    const rows = await context.db.insert(staffInvites).values(values).returning();
    const invite = singleRow(rows, "createStaffInvite");
    if (roleIds.length > 0) {
      await context.db.insert(staffInviteRoles).values(
        roleIds.map((roleId) => ({
          inviteId: invite.id,
          roleId,
        })),
      );
    }
    return invite;
  }

  async listStaffInvites(limit = 50): Promise<StaffInviteRecord[]> {
    return this.db.select().from(staffInvites).orderBy(desc(staffInvites.createdAt)).limit(limit);
  }

  async findStaffInviteByTokenHash(tokenHash: string): Promise<StaffInviteRecord | null> {
    const rows = await this.db
      .select()
      .from(staffInvites)
      .where(eq(staffInvites.tokenHash, tokenHash))
      .limit(1);
    return rows[0] ?? null;
  }

  async createTrustedDevice(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof trustedDevices>,
  ): Promise<TrustedDeviceRecord> {
    const rows = await context.db.insert(trustedDevices).values(values).returning();
    return singleRow(rows, "createTrustedDevice");
  }

  async findTrustedDeviceByTokenHash(
    userId: string,
    deviceTokenHash: string,
  ): Promise<TrustedDeviceRecord | null> {
    const rows = await this.db
      .select()
      .from(trustedDevices)
      .where(
        and(
          eq(trustedDevices.userId, userId),
          eq(trustedDevices.deviceTokenHash, deviceTokenHash),
          isNull(trustedDevices.revokedAt),
          gt(trustedDevices.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async listTrustedDevicesByUserId(userId: string): Promise<TrustedDeviceRecord[]> {
    return this.db.select().from(trustedDevices).where(eq(trustedDevices.userId, userId));
  }

  async touchTrustedDevice(
    context: DrizzleTransactionContext,
    trustedDeviceId: string,
    lastUsedAt: Date,
  ): Promise<TrustedDeviceRecord> {
    const rows = await context.db
      .update(trustedDevices)
      .set({ lastUsedAt })
      .where(eq(trustedDevices.id, trustedDeviceId))
      .returning();

    return singleRow(rows, "touchTrustedDevice");
  }

  async revokeTrustedDeviceForUser(
    context: DrizzleTransactionContext,
    userId: string,
    trustedDeviceId: string,
    revokedAt: Date,
  ): Promise<TrustedDeviceRecord> {
    const rows = await context.db
      .update(trustedDevices)
      .set({ revokedAt })
      .where(and(eq(trustedDevices.id, trustedDeviceId), eq(trustedDevices.userId, userId)))
      .returning();

    return singleRow(rows, "revokeTrustedDeviceForUser");
  }

  async createSession(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof sessions>,
  ): Promise<SessionRecord> {
    const rows = await context.db.insert(sessions).values(values).returning();
    return singleRow(rows, "createSession");
  }

  async ensureSession(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof sessions>,
  ): Promise<SessionRecord> {
    const rows = await context.db
      .insert(sessions)
      .values(values)
      .onConflictDoUpdate({
        target: sessions.sessionTokenHash,
        set: {
          trustedDeviceId: values.trustedDeviceId,
          status: "active",
          lastSeenAt: values.lastSeenAt,
          expiresAt: values.expiresAt,
          revokedAt: null,
          ipAddressHash: values.ipAddressHash,
          userAgentHash: values.userAgentHash,
        },
      })
      .returning();

    return singleRow(rows, "ensureSession");
  }

  async listSessionsByUserId(userId: string): Promise<SessionRecord[]> {
    return this.db.select().from(sessions).where(eq(sessions.userId, userId));
  }

  async findSessionByTokenHash(
    userId: string,
    sessionTokenHash: string,
  ): Promise<SessionRecord | null> {
    const rows = await this.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userId, userId), eq(sessions.sessionTokenHash, sessionTokenHash)))
      .limit(1);

    return rows[0] ?? null;
  }

  async touchSession(
    context: DrizzleTransactionContext,
    sessionId: string,
    lastSeenAt: Date,
  ): Promise<SessionRecord> {
    const rows = await context.db
      .update(sessions)
      .set({ lastSeenAt })
      .where(eq(sessions.id, sessionId))
      .returning();

    return singleRow(rows, "touchSession");
  }

  async revokeSession(
    context: DrizzleTransactionContext,
    sessionId: string,
    revokedAt: Date,
  ): Promise<SessionRecord> {
    const rows = await context.db
      .update(sessions)
      .set({ status: "revoked", revokedAt })
      .where(eq(sessions.id, sessionId))
      .returning();

    return singleRow(rows, "revokeSession");
  }

  async revokeOtherSessions(
    context: DrizzleTransactionContext,
    userId: string,
    currentSessionTokenHash: string,
    revokedAt: Date,
  ): Promise<SessionRecord[]> {
    return context.db
      .update(sessions)
      .set({ status: "revoked", revokedAt })
      .where(
        and(
          eq(sessions.userId, userId),
          eq(sessions.status, "active"),
          ne(sessions.sessionTokenHash, currentSessionTokenHash),
        ),
      )
      .returning();
  }

  async countActiveAssignmentsForRole(roleId: string): Promise<number> {
    const rows = await this.db
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .where(and(eq(userRoles.roleId, roleId), isNull(userRoles.revokedAt)));
    return rows.length;
  }

  async deleteRole(context: DrizzleTransactionContext, roleId: string): Promise<void> {
    await context.db.delete(roles).where(eq(roles.id, roleId));
  }

  async listRoleIdsForUser(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ roleId: userRoles.roleId })
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), isNull(userRoles.revokedAt)));
    return rows.map((row) => row.roleId);
  }

  async replaceStaffRoles(
    context: DrizzleTransactionContext,
    userId: string,
    roleIds: string[],
    grantedBy: string | null,
  ): Promise<void> {
    await context.db
      .update(userRoles)
      .set({ revokedAt: new Date() })
      .where(and(eq(userRoles.userId, userId), isNull(userRoles.revokedAt)));
    for (const roleId of roleIds) {
      await context.db.insert(userRoles).values({
        userId,
        roleId,
        grantedBy,
      });
    }
  }
}

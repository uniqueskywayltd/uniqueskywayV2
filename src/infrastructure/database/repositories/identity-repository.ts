import { and, eq, gt, isNull, ne } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { adminProfiles, roles, sessions, trustedDevices, users } from "../schema";
import type { DrizzleTransactionContext } from "../transactions";
import type { AppDatabaseExecutor } from "../types";
import { BaseDrizzleRepository, singleRow } from "./base-repository";

export type UserRecord = InferSelectModel<typeof users>;
export type NewUserRecord = InferInsertModel<typeof users>;
export type AdminProfileRecord = InferSelectModel<typeof adminProfiles>;
export type RoleRecord = InferSelectModel<typeof roles>;
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

  async listRoles(): Promise<RoleRecord[]> {
    return this.db.select().from(roles);
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
}

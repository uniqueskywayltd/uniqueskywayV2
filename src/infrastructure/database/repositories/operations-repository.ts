import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { desc, eq } from "drizzle-orm";

import { auditLogs, backgroundJobs, featureFlags, securityEvents, systemSettings } from "../schema";
import type { DrizzleTransactionContext } from "../transactions";
import type { AppDatabaseExecutor } from "../types";
import { BaseDrizzleRepository, singleRow } from "./base-repository";

export type SystemSettingRecord = InferSelectModel<typeof systemSettings>;
export type FeatureFlagRecord = InferSelectModel<typeof featureFlags>;
export type BackgroundJobRecord = InferSelectModel<typeof backgroundJobs>;
export type AuditLogRecord = InferSelectModel<typeof auditLogs>;
export type SecurityEventRecord = InferSelectModel<typeof securityEvents>;

export class OperationsRepository extends BaseDrizzleRepository {
  constructor(db: AppDatabaseExecutor) {
    super("operations", db);
  }

  protected clone(db: AppDatabaseExecutor): OperationsRepository {
    return new OperationsRepository(db);
  }

  async createBackgroundJob(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof backgroundJobs>,
  ): Promise<BackgroundJobRecord> {
    const rows = await context.db.insert(backgroundJobs).values(values).returning();
    return singleRow(rows, "createBackgroundJob");
  }

  async appendAuditLog(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof auditLogs>,
  ): Promise<AuditLogRecord> {
    const rows = await context.db.insert(auditLogs).values(values).returning();
    return singleRow(rows, "appendAuditLog");
  }

  async listAuditLogsByActorUserId(userId: string, limit = 50): Promise<AuditLogRecord[]> {
    return this.db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.actorUserId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  async appendSecurityEvent(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof securityEvents>,
  ): Promise<SecurityEventRecord> {
    const rows = await context.db.insert(securityEvents).values(values).returning();
    return singleRow(rows, "appendSecurityEvent");
  }

  async listSecurityEventsByUserId(userId: string, limit = 50): Promise<SecurityEventRecord[]> {
    return this.db
      .select()
      .from(securityEvents)
      .where(eq(securityEvents.userId, userId))
      .orderBy(desc(securityEvents.createdAt))
      .limit(limit);
  }

  async upsertSystemSetting(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof systemSettings>,
  ): Promise<SystemSettingRecord> {
    const rows = await context.db
      .insert(systemSettings)
      .values(values)
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: values.value,
          description: values.description,
          updatedBy: values.updatedBy,
          updatedAt: new Date(),
        },
      })
      .returning();

    return singleRow(rows, "upsertSystemSetting");
  }

  async upsertFeatureFlag(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof featureFlags>,
  ): Promise<FeatureFlagRecord> {
    const rows = await context.db
      .insert(featureFlags)
      .values(values)
      .onConflictDoUpdate({
        target: featureFlags.key,
        set: {
          status: values.status,
          description: values.description,
          rules: values.rules,
          updatedAt: new Date(),
        },
      })
      .returning();

    return singleRow(rows, "upsertFeatureFlag");
  }
}

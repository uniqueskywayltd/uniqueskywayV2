import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { and, desc, eq, inArray, lt, or, sql } from "drizzle-orm";

import {
  adminEntityNotes,
  auditLogs,
  backgroundJobs,
  emailTemplateCatalog,
  featureFlags,
  notificationTemplateCatalog,
  securityEvents,
  systemSettings,
} from "../schema";
import type { DrizzleTransactionContext } from "../transactions";
import type { AppDatabaseExecutor } from "../types";
import { BaseDrizzleRepository, decodeKeysetCursor, encodeKeysetCursor, singleRow } from "./base-repository";

export type SystemSettingRecord = InferSelectModel<typeof systemSettings>;
export type FeatureFlagRecord = InferSelectModel<typeof featureFlags>;
export type BackgroundJobRecord = InferSelectModel<typeof backgroundJobs>;
export type AuditLogRecord = InferSelectModel<typeof auditLogs>;
export type SecurityEventRecord = InferSelectModel<typeof securityEvents>;
export type AdminEntityNoteRecord = InferSelectModel<typeof adminEntityNotes>;
export type EmailTemplateCatalogRecord = InferSelectModel<typeof emailTemplateCatalog>;
export type NotificationTemplateCatalogRecord = InferSelectModel<typeof notificationTemplateCatalog>;

export interface ListBackgroundJobsQuery {
  status?: BackgroundJobRecord["status"];
  jobType?: string;
  cursor?: string;
  limit: number;
}

export interface ListBackgroundJobsResult {
  rows: BackgroundJobRecord[];
  nextCursor: string | null;
}

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

  async listAuditLogsByTarget(
    targetType: string,
    targetId: string,
    limit = 50,
  ): Promise<AuditLogRecord[]> {
    return this.db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.targetType, targetType), eq(auditLogs.targetId, targetId)))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  async listAuditLogsForCustomerTimeline(userId: string, limit = 50): Promise<AuditLogRecord[]> {
    return this.db
      .select()
      .from(auditLogs)
      .where(or(eq(auditLogs.actorUserId, userId), eq(auditLogs.targetId, userId)))
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
          enabledAt: values.enabledAt,
          disabledAt: values.disabledAt,
          scheduleStartAt: values.scheduleStartAt,
          scheduleEndAt: values.scheduleEndAt,
          rolloutPercent: values.rolloutPercent,
          internalOnly: values.internalOnly,
          updatedAt: new Date(),
        },
      })
      .returning();

    return singleRow(rows, "upsertFeatureFlag");
  }

  async listBackgroundJobs(query: ListBackgroundJobsQuery): Promise<ListBackgroundJobsResult> {
    const conditions = [];

    if (query.status) conditions.push(eq(backgroundJobs.status, query.status));
    if (query.jobType) conditions.push(eq(backgroundJobs.jobType, query.jobType));
    if (query.cursor) {
      const cursor = decodeKeysetCursor(query.cursor);
      conditions.push(
        or(
          lt(backgroundJobs.createdAt, cursor.createdAt),
          and(eq(backgroundJobs.createdAt, cursor.createdAt), lt(backgroundJobs.id, cursor.id)),
        ),
      );
    }

    const rows = await this.db
      .select()
      .from(backgroundJobs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(backgroundJobs.createdAt), desc(backgroundJobs.id))
      .limit(query.limit + 1);

    const hasMore = rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;
    const lastRow = pageRows[pageRows.length - 1];
    const nextCursor =
      hasMore && lastRow
        ? encodeKeysetCursor({ createdAt: lastRow.createdAt, id: lastRow.id })
        : null;

    return { rows: pageRows, nextCursor };
  }

  async countBackgroundJobsByStatus(status: BackgroundJobRecord["status"]): Promise<number> {
    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(backgroundJobs)
      .where(eq(backgroundJobs.status, status));
    return rows[0]?.count ?? 0;
  }

  async createAdminEntityNote(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof adminEntityNotes>,
  ): Promise<AdminEntityNoteRecord> {
    const rows = await context.db.insert(adminEntityNotes).values(values).returning();
    return singleRow(rows, "createAdminEntityNote");
  }

  async listAdminEntityNotes(
    targetType: string,
    targetId: string,
    limit = 50,
  ): Promise<AdminEntityNoteRecord[]> {
    return this.db
      .select()
      .from(adminEntityNotes)
      .where(and(eq(adminEntityNotes.targetType, targetType), eq(adminEntityNotes.targetId, targetId)))
      .orderBy(desc(adminEntityNotes.createdAt))
      .limit(limit);
  }

  async listRecentFinancialAuditLogs(limit = 50): Promise<AuditLogRecord[]> {
    return this.db
      .select()
      .from(auditLogs)
      .where(inArray(auditLogs.targetType, ["deposit_intent", "withdrawal_request"]))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  async listSystemSettings(): Promise<SystemSettingRecord[]> {
    return this.db.select().from(systemSettings).orderBy(systemSettings.key);
  }

  async getSystemSetting(key: string): Promise<SystemSettingRecord | null> {
    const rows = await this.db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);
    return rows[0] ?? null;
  }

  async listFeatureFlags(): Promise<FeatureFlagRecord[]> {
    return this.db.select().from(featureFlags).orderBy(featureFlags.key);
  }

  async getFeatureFlag(key: string): Promise<FeatureFlagRecord | null> {
    const rows = await this.db.select().from(featureFlags).where(eq(featureFlags.key, key)).limit(1);
    return rows[0] ?? null;
  }

  async updateFeatureFlag(
    context: DrizzleTransactionContext,
    key: string,
    values: Partial<
      Pick<
        FeatureFlagRecord,
        | "status"
        | "description"
        | "rules"
        | "enabledAt"
        | "disabledAt"
        | "scheduleStartAt"
        | "scheduleEndAt"
        | "rolloutPercent"
        | "internalOnly"
      >
    >,
  ): Promise<FeatureFlagRecord> {
    const rows = await context.db
      .update(featureFlags)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(featureFlags.key, key))
      .returning();
    return singleRow(rows, "updateFeatureFlag");
  }

  async listAuditLogs(input: {
    action?: string;
    actorUserId?: string;
    targetType?: string;
    limit?: number;
  }): Promise<AuditLogRecord[]> {
    const limit = input.limit ?? 50;
    const conditions = [];
    if (input.action) conditions.push(eq(auditLogs.action, input.action));
    if (input.actorUserId) conditions.push(eq(auditLogs.actorUserId, input.actorUserId));
    if (input.targetType) conditions.push(eq(auditLogs.targetType, input.targetType));
    return this.db
      .select()
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  async listSecurityEvents(input: {
    severity?: SecurityEventRecord["severity"];
    userId?: string;
    limit?: number;
  }): Promise<SecurityEventRecord[]> {
    const limit = input.limit ?? 50;
    const conditions = [];
    if (input.severity) conditions.push(eq(securityEvents.severity, input.severity));
    if (input.userId) conditions.push(eq(securityEvents.userId, input.userId));
    return this.db
      .select()
      .from(securityEvents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(securityEvents.createdAt))
      .limit(limit);
  }

  async findBackgroundJobById(jobId: string): Promise<BackgroundJobRecord | null> {
    const rows = await this.db
      .select()
      .from(backgroundJobs)
      .where(eq(backgroundJobs.id, jobId))
      .limit(1);
    return rows[0] ?? null;
  }

  async retryBackgroundJob(
    context: DrizzleTransactionContext,
    jobId: string,
  ): Promise<BackgroundJobRecord> {
    const rows = await context.db
      .update(backgroundJobs)
      .set({
        status: "pending",
        lastError: null,
        lockedAt: null,
        lockedBy: null,
        runAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(backgroundJobs.id, jobId))
      .returning();
    return singleRow(rows, "retryBackgroundJob");
  }

  async cancelBackgroundJob(
    context: DrizzleTransactionContext,
    jobId: string,
  ): Promise<BackgroundJobRecord> {
    const rows = await context.db
      .update(backgroundJobs)
      .set({
        status: "cancelled",
        lockedAt: null,
        lockedBy: null,
        updatedAt: new Date(),
      })
      .where(eq(backgroundJobs.id, jobId))
      .returning();
    return singleRow(rows, "cancelBackgroundJob");
  }

  async listEmailTemplates(): Promise<EmailTemplateCatalogRecord[]> {
    return this.db.select().from(emailTemplateCatalog).orderBy(emailTemplateCatalog.key);
  }

  async getEmailTemplate(key: string): Promise<EmailTemplateCatalogRecord | null> {
    const rows = await this.db
      .select()
      .from(emailTemplateCatalog)
      .where(eq(emailTemplateCatalog.key, key))
      .limit(1);
    return rows[0] ?? null;
  }

  async updateEmailTemplate(
    context: DrizzleTransactionContext,
    key: string,
    values: Partial<
      Pick<
        EmailTemplateCatalogRecord,
        "name" | "description" | "status" | "currentVersion" | "previewSample" | "updatedBy"
      >
    >,
  ): Promise<EmailTemplateCatalogRecord> {
    const rows = await context.db
      .update(emailTemplateCatalog)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(emailTemplateCatalog.key, key))
      .returning();
    return singleRow(rows, "updateEmailTemplate");
  }

  async listNotificationTemplates(): Promise<NotificationTemplateCatalogRecord[]> {
    return this.db
      .select()
      .from(notificationTemplateCatalog)
      .orderBy(notificationTemplateCatalog.key);
  }

  async getNotificationTemplate(key: string): Promise<NotificationTemplateCatalogRecord | null> {
    const rows = await this.db
      .select()
      .from(notificationTemplateCatalog)
      .where(eq(notificationTemplateCatalog.key, key))
      .limit(1);
    return rows[0] ?? null;
  }

  async updateNotificationTemplate(
    context: DrizzleTransactionContext,
    key: string,
    values: Partial<
      Pick<
        NotificationTemplateCatalogRecord,
        | "name"
        | "description"
        | "channel"
        | "status"
        | "currentVersion"
        | "previewSample"
        | "updatedBy"
      >
    >,
  ): Promise<NotificationTemplateCatalogRecord> {
    const rows = await context.db
      .update(notificationTemplateCatalog)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(notificationTemplateCatalog.key, key))
      .returning();
    return singleRow(rows, "updateNotificationTemplate");
  }
}

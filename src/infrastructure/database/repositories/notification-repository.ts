import { and, asc, desc, eq, ilike, inArray, isNull, like, or, sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import {
  emailMessages,
  notificationChannelPreferences,
  notificationDeliveries,
  notifications,
  outboxEvents,
} from "../schema";
import type { DrizzleTransactionContext } from "../transactions";
import type { AppDatabaseExecutor } from "../types";
import { BaseDrizzleRepository, singleRow } from "./base-repository";

export type NotificationRecord = InferSelectModel<typeof notifications>;
export type NotificationChannelPreferenceRecord = InferSelectModel<
  typeof notificationChannelPreferences
>;
export type NotificationDeliveryRecord = InferSelectModel<typeof notificationDeliveries>;
export type EmailMessageRecord = InferSelectModel<typeof emailMessages>;
export type OutboxEventRecord = InferSelectModel<typeof outboxEvents>;

export class NotificationRepository extends BaseDrizzleRepository {
  constructor(db: AppDatabaseExecutor) {
    super("notifications", db);
  }

  protected clone(db: AppDatabaseExecutor): NotificationRepository {
    return new NotificationRepository(db);
  }

  async createNotification(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof notifications>,
  ): Promise<NotificationRecord> {
    const rows = await context.db.insert(notifications).values(values).returning();
    return singleRow(rows, "createNotification");
  }

  async listNotificationsByUserId(input: {
    userId: string;
    query?: string;
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<NotificationRecord[]> {
    const conditions = [eq(notifications.userId, input.userId)];

    if (input.query) {
      const pattern = `%${input.query}%`;
      conditions.push(or(ilike(notifications.title, pattern), ilike(notifications.body, pattern))!);
    }

    if (input.unreadOnly) {
      conditions.push(isNull(notifications.readAt));
    }

    return this.db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(input.limit ?? 50);
  }

  async countUnreadNotificationsByUserId(userId: string): Promise<number> {
    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

    return rows[0]?.count ?? 0;
  }

  async markNotificationRead(
    context: DrizzleTransactionContext,
    userId: string,
    notificationId: string,
    readAt: Date,
  ): Promise<NotificationRecord> {
    const rows = await context.db
      .update(notifications)
      .set({ readAt })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
      .returning();

    return singleRow(rows, "markNotificationRead");
  }

  async createNotificationDelivery(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof notificationDeliveries>,
  ): Promise<NotificationDeliveryRecord> {
    const rows = await context.db.insert(notificationDeliveries).values(values).returning();
    return singleRow(rows, "createNotificationDelivery");
  }

  async listNotificationPreferencesByUserId(
    userId: string,
  ): Promise<NotificationChannelPreferenceRecord[]> {
    return this.db
      .select()
      .from(notificationChannelPreferences)
      .where(eq(notificationChannelPreferences.userId, userId))
      .orderBy(
        asc(notificationChannelPreferences.topic),
        asc(notificationChannelPreferences.channel),
      );
  }

  async upsertNotificationPreference(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof notificationChannelPreferences>,
  ): Promise<NotificationChannelPreferenceRecord> {
    const rows = await context.db
      .insert(notificationChannelPreferences)
      .values(values)
      .onConflictDoUpdate({
        target: [
          notificationChannelPreferences.userId,
          notificationChannelPreferences.channel,
          notificationChannelPreferences.topic,
        ],
        set: {
          enabled: values.enabled,
          updatedAt: new Date(),
        },
      })
      .returning();

    return singleRow(rows, "upsertNotificationPreference");
  }

  async enqueueEmail(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof emailMessages>,
  ): Promise<EmailMessageRecord> {
    const rows = await context.db.insert(emailMessages).values(values).returning();
    return singleRow(rows, "enqueueEmail");
  }

  async listQueuedIdentityEmails(limit = 10): Promise<EmailMessageRecord[]> {
    return this.db
      .select()
      .from(emailMessages)
      .where(
        and(
          inArray(emailMessages.status, ["queued", "failed"]),
          like(emailMessages.templateKey, "auth.%"),
        ),
      )
      .orderBy(asc(emailMessages.createdAt))
      .limit(limit);
  }

  async markEmailSending(
    context: DrizzleTransactionContext,
    emailMessageId: string,
  ): Promise<EmailMessageRecord> {
    const rows = await context.db
      .update(emailMessages)
      .set({
        status: "sending",
        updatedAt: new Date(),
      })
      .where(eq(emailMessages.id, emailMessageId))
      .returning();

    return singleRow(rows, "markEmailSending");
  }

  async markEmailSent(
    context: DrizzleTransactionContext,
    emailMessageId: string,
    providerMessageId: string,
  ): Promise<EmailMessageRecord> {
    const now = new Date();
    const rows = await context.db
      .update(emailMessages)
      .set({
        status: "sent",
        providerMessageId,
        sentAt: now,
        updatedAt: now,
      })
      .where(eq(emailMessages.id, emailMessageId))
      .returning();

    return singleRow(rows, "markEmailSent");
  }

  async markEmailFailed(
    context: DrizzleTransactionContext,
    emailMessageId: string,
    lastError: string,
  ): Promise<EmailMessageRecord> {
    const rows = await context.db
      .update(emailMessages)
      .set({
        status: "failed",
        lastError,
        attemptCount: sql`${emailMessages.attemptCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(emailMessages.id, emailMessageId))
      .returning();

    return singleRow(rows, "markEmailFailed");
  }

  async enqueueOutboxEvent(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof outboxEvents>,
  ): Promise<OutboxEventRecord> {
    const rows = await context.db.insert(outboxEvents).values(values).returning();
    return singleRow(rows, "enqueueOutboxEvent");
  }
}

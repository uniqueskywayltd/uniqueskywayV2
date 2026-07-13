import type { EntityId, IsoDateTimeString } from "@/domains/shared";
import type { UserId } from "@/domains/identity";

export type NotificationId = EntityId<"Notification">;
export type NotificationDeliveryId = EntityId<"NotificationDelivery">;
export type EmailMessageId = EntityId<"EmailMessage">;
export type OutboxEventId = EntityId<"OutboxEvent">;

export type NotificationPriority = "info" | "success" | "warning" | "critical";
export type NotificationChannel = "in_app" | "email" | "sms" | "push";
export type DeliveryStatus =
  "pending" | "processing" | "sent" | "delivered" | "failed" | "suppressed";
export type EmailStatus =
  "queued" | "sending" | "sent" | "delivered" | "bounced" | "complained" | "failed" | "suppressed";
export type OutboxStatus = "pending" | "processing" | "processed" | "failed" | "dead_lettered";

export interface Notification {
  id: NotificationId;
  userId: UserId;
  type: string;
  title: string;
  body: string;
  priority: NotificationPriority;
  data: Record<string, unknown>;
  readAt: IsoDateTimeString | null;
  createdAt: IsoDateTimeString;
}

export interface EmailMessage {
  id: EmailMessageId;
  recipientUserId: UserId | null;
  toEmail: string;
  templateKey: string;
  templateVersion: string;
  idempotencyKey: string;
  providerMessageId: string | null;
  status: EmailStatus;
  attemptCount: number;
  lastError: string | null;
  createdAt: IsoDateTimeString;
  sentAt: IsoDateTimeString | null;
  updatedAt: IsoDateTimeString;
}

export interface OutboxEvent {
  id: OutboxEventId;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  status: OutboxStatus;
  attemptCount: number;
  availableAt: IsoDateTimeString;
  processedAt: IsoDateTimeString | null;
  lastError: string | null;
  createdAt: IsoDateTimeString;
}

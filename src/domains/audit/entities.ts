import type { EntityId, IsoDateTimeString } from "@/domains/shared";
import type { UserId } from "@/domains/identity";

export type AuditLogId = EntityId<"AuditLog">;
export type SecurityEventId = EntityId<"SecurityEvent">;
export type ActorType = "customer" | "admin" | "system";
export type SecuritySeverity = "info" | "warning" | "critical";

export interface AuditLog {
  id: AuditLogId;
  actorUserId: UserId | null;
  actorType: ActorType;
  action: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  metadata: Record<string, unknown>;
  requestId: string | null;
  ipAddressHash: string | null;
  userAgentHash: string | null;
  createdAt: IsoDateTimeString;
}

export interface SecurityEvent {
  id: SecurityEventId;
  userId: UserId | null;
  eventType: string;
  severity: SecuritySeverity;
  metadata: Record<string, unknown>;
  ipAddressHash: string | null;
  createdAt: IsoDateTimeString;
}

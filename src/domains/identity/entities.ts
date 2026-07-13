import type { EntityId, IsoDateTimeString } from "@/domains/shared";

export type UserId = EntityId<"User">;
export type AdminProfileId = EntityId<"AdminProfile">;
export type RoleId = EntityId<"Role">;
export type TrustedDeviceId = EntityId<"TrustedDevice">;
export type SessionId = EntityId<"Session">;

export type UserStatus = "active" | "restricted" | "closed";
export type AdminProfileStatus = "active" | "suspended" | "deactivated";
export type SessionStatus = "active" | "revoked" | "expired";

export interface User {
  id: UserId;
  authUserId: string;
  email: string;
  emailVerifiedAt: IsoDateTimeString | null;
  status: UserStatus;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface AdminProfile {
  id: AdminProfileId;
  userId: UserId;
  status: AdminProfileStatus;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface Role {
  id: RoleId;
  key: string;
  name: string;
  description: string | null;
  createdAt: IsoDateTimeString;
}

export interface UserRole {
  userId: UserId;
  roleId: RoleId;
  grantedBy: UserId | null;
  grantedAt: IsoDateTimeString;
  revokedAt: IsoDateTimeString | null;
}

export interface TrustedDevice {
  id: TrustedDeviceId;
  userId: UserId;
  deviceTokenHash: string;
  label: string | null;
  lastUsedAt: IsoDateTimeString | null;
  expiresAt: IsoDateTimeString;
  revokedAt: IsoDateTimeString | null;
  createdAt: IsoDateTimeString;
}

export interface Session {
  id: SessionId;
  userId: UserId;
  supabaseSessionId: string | null;
  sessionTokenHash: string;
  trustedDeviceId: TrustedDeviceId | null;
  status: SessionStatus;
  stepUpVerifiedAt: IsoDateTimeString | null;
  lastSeenAt: IsoDateTimeString | null;
  expiresAt: IsoDateTimeString;
  revokedAt: IsoDateTimeString | null;
  createdAt: IsoDateTimeString;
}

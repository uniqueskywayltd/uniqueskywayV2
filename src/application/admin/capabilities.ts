/**
 * Canonical admin permission keys from ADMIN_PERMISSION_MATRIX.md.
 * Runtime authorization loads grants from the database — this list is the
 * typed catalog only, not a role map.
 *
 * Absolute controller roles bypass per-key checks and receive the full catalog.
 */
export const ADMIN_PERMISSIONS = [
  "customers.read",
  "customers.update",
  "customers.suspend",
  "customers.notes",
  "customers.kyc",
  "deposits.read",
  "deposits.review",
  "deposits.approve",
  "withdrawals.read",
  "withdrawals.review",
  "withdrawals.approve",
  "investments.read",
  "investments.update",
  "settlements.read",
  "settlements.manage",
  "reports.read",
  "reports.export",
  "emails.manage",
  "notifications.manage",
  "featureflags.manage",
  "system.manage",
  "roles.manage",
  "permissions.manage",
  "staff.manage",
  "staff.reset_password",
  "audit.read",
  "jobs.manage",
  "security.read",
  "monitoring.read",
  "overview.read",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

/** @deprecated Use AdminPermission */
export type AdminCapability = AdminPermission;

/**
 * Roles with unrestricted admin-console authority.
 * These actors may perform any administrative action without a per-key grant.
 */
export const ABSOLUTE_ADMIN_ROLES = ["super_admin", "platform_admin"] as const;

export type AbsoluteAdminRole = (typeof ABSOLUTE_ADMIN_ROLES)[number];

export function isAbsoluteAdminRole(roleKey: string): roleKey is AbsoluteAdminRole {
  return (ABSOLUTE_ADMIN_ROLES as readonly string[]).includes(roleKey);
}

export function hasAbsoluteAdminControl(roleKeys: readonly string[]): boolean {
  return roleKeys.some((roleKey) => isAbsoluteAdminRole(roleKey));
}

export function isAdminPermission(value: string): value is AdminPermission {
  return (ADMIN_PERMISSIONS as readonly string[]).includes(value);
}

export function permissionKeysInclude(
  permissionKeys: readonly string[],
  permission: AdminPermission,
  roleKeys: readonly string[] = [],
): boolean {
  if (hasAbsoluteAdminControl(roleKeys)) {
    return true;
  }
  return permissionKeys.includes(permission);
}

/** Effective permission set for UI/API responses (absolute controllers get the full catalog). */
export function effectiveAdminPermissionKeys(
  roleKeys: readonly string[],
  permissionKeys: readonly string[],
): string[] {
  if (hasAbsoluteAdminControl(roleKeys)) {
    return [...ADMIN_PERMISSIONS];
  }
  return [...permissionKeys];
}

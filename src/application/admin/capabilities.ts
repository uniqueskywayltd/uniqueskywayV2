/**
 * Canonical admin permission keys from ADMIN_PERMISSION_MATRIX.md.
 * Runtime authorization loads grants from the database — this list is the
 * typed catalog only, not a role map.
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
  "settlements.read",
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

export function isAdminPermission(value: string): value is AdminPermission {
  return (ADMIN_PERMISSIONS as readonly string[]).includes(value);
}

export function permissionKeysInclude(
  permissionKeys: readonly string[],
  permission: AdminPermission,
): boolean {
  return permissionKeys.includes(permission);
}

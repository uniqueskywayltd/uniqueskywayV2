export const ADMIN_CAPABILITIES = [
  "admin.users.read",
  "admin.users.restrict",
  "admin.kyc.review",
  "admin.users.notes.write",
] as const;

export type AdminCapability = (typeof ADMIN_CAPABILITIES)[number];

export const ADMIN_CAPABILITY_ROLES: Readonly<Record<AdminCapability, readonly string[]>> = {
  "admin.users.read": ["support_agent", "finance_admin", "platform_admin"],
  "admin.users.restrict": ["platform_admin"],
  "admin.kyc.review": ["platform_admin"],
  "admin.users.notes.write": ["support_agent", "platform_admin"],
};

export function roleKeysSatisfyCapability(
  roleKeys: readonly string[],
  capability: AdminCapability,
): boolean {
  const allowedRoles = ADMIN_CAPABILITY_ROLES[capability];
  return roleKeys.some((roleKey) => allowedRoles.includes(roleKey));
}

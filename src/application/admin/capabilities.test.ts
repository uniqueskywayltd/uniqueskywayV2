import { describe, expect, it } from "vitest";

import {
  ADMIN_PERMISSIONS,
  effectiveAdminPermissionKeys,
  hasAbsoluteAdminControl,
  isAbsoluteAdminRole,
  permissionKeysInclude,
} from "./capabilities";

describe("absolute admin control", () => {
  it("recognizes absolute controller roles", () => {
    expect(isAbsoluteAdminRole("super_admin")).toBe(true);
    expect(isAbsoluteAdminRole("platform_admin")).toBe(true);
    expect(isAbsoluteAdminRole("finance_manager")).toBe(false);
    expect(hasAbsoluteAdminControl(["finance_officer"])).toBe(false);
    expect(hasAbsoluteAdminControl(["platform_admin", "auditor"])).toBe(true);
  });

  it("bypasses per-key checks for absolute controllers", () => {
    expect(permissionKeysInclude([], "staff.manage", ["platform_admin"])).toBe(true);
    expect(permissionKeysInclude([], "roles.manage", ["super_admin"])).toBe(true);
    expect(permissionKeysInclude(["customers.read"], "staff.manage", ["support_agent"])).toBe(
      false,
    );
  });

  it("expands effective permissions to the full catalog", () => {
    expect(effectiveAdminPermissionKeys(["platform_admin"], ["overview.read"])).toEqual([
      ...ADMIN_PERMISSIONS,
    ]);
    expect(effectiveAdminPermissionKeys(["auditor"], ["overview.read", "audit.read"])).toEqual([
      "overview.read",
      "audit.read",
    ]);
  });
});

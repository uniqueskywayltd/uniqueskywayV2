import { describe, expect, it, vi } from "vitest";

import type { AuthenticatedUser } from "@/application/auth";

import { AdminSystemService } from "./admin-system-service";
import { permissionKeysForRoles } from "./test-role-permissions";

const auditContext = {
  requestId: "request_1",
  ipAddressHash: null,
  userAgentHash: null,
};

describe("AdminSystemService", () => {
  it("rejects unauthenticated access to permission listing", async () => {
    const fixture = createFixture({ authenticated: false });

    await expect(fixture.service.listPermissions()).rejects.toMatchObject({
      code: "AUTHENTICATION_ERROR",
    });
  });

  it("rejects actors without roles.manage from creating roles", async () => {
    const fixture = createFixture({ roleKeys: ["support_agent"] });

    await expect(
      fixture.service.createRole(
        { key: "custom_ops", name: "Custom Ops", permissionKeys: ["customers.read"] },
        auditContext,
      ),
    ).rejects.toMatchObject({ code: "AUTHORIZATION_ERROR" });
  });

  it("creates a configurable role and replaces its permissions from the catalog", async () => {
    const fixture = createFixture({ roleKeys: ["super_admin"] });

    const role = await fixture.service.createRole(
      {
        key: "custom_ops",
        name: "Custom Ops",
        description: "Configurable role",
        permissionKeys: ["customers.read", "audit.read"],
      },
      auditContext,
    );

    expect(role.key).toBe("custom_ops");
    expect(fixture.identityRepository.createRole).toHaveBeenCalled();
    expect(fixture.identityRepository.replaceRolePermissions).toHaveBeenCalledWith(
      expect.anything(),
      role.id,
      ["customers.read", "audit.read"],
      "admin_1",
    );
    expect(fixture.operationsRepository.appendAuditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        action: "role.created",
        metadata: expect.objectContaining({ permissionUsed: "roles.manage" }),
      }),
    );
  });

  it("loads authorization from database permission keys rather than hardcoded role maps", async () => {
    const fixture = createFixture({
      roleKeys: ["custom_role"],
      permissionKeys: ["featureflags.manage", "system.manage"],
    });

    await fixture.service.listFeatureFlags();
    await fixture.service.listSettings();

    expect(fixture.identityRepository.listActivePermissionKeysForUser).toHaveBeenCalled();
    expect(fixture.operationsRepository.listFeatureFlags).toHaveBeenCalled();
    expect(fixture.operationsRepository.listSystemSettings).toHaveBeenCalled();
  });

  it("invites staff, updates staff status, and audits each action", async () => {
    const fixture = createFixture({ roleKeys: ["super_admin"] });

    const invite = await fixture.service.inviteStaff(
      { email: "ops@example.com", roleIds: ["role_1"] },
      auditContext,
    );
    expect(invite.invite.email).toBe("ops@example.com");
    expect(invite.inviteToken).toHaveLength(64);

    const profile = await fixture.service.setStaffStatus(
      "staff_1",
      { status: "suspended", reason: "Policy violation" },
      auditContext,
    );
    expect(profile.status).toBe("suspended");
    expect(fixture.operationsRepository.appendAuditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: "staff.status_updated" }),
    );
  });

  it("upserts feature flags and settings with audit before/after payloads", async () => {
    const fixture = createFixture({ roleKeys: ["platform_admin"] });

    const flag = await fixture.service.upsertFeatureFlag(
      {
        key: "maintenance_mode",
        status: "enabled",
        description: "Scheduled maintenance",
        rolloutPercent: 25,
        internalOnly: true,
      },
      auditContext,
    );
    expect(flag.key).toBe("maintenance_mode");
    expect(fixture.operationsRepository.upsertFeatureFlag).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        key: "maintenance_mode",
        rolloutPercent: 25,
        internalOnly: true,
      }),
    );

    const setting = await fixture.service.upsertSetting(
      { key: "platform_name", value: "Unique Sky Way", description: "Brand" },
      auditContext,
    );
    expect(setting.key).toBe("platform_name");
    expect(fixture.operationsRepository.appendAuditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: "system_setting.upserted" }),
    );
  });

  it("manages email template status and queues a test send without changing delivery adapters", async () => {
    const fixture = createFixture({ roleKeys: ["platform_admin"] });

    const updated = await fixture.service.setEmailTemplateStatus(
      "auth.password_reset",
      "disabled",
      auditContext,
    );
    expect(updated.status).toBe("disabled");

    fixture.state.emailTemplate.status = "enabled";
    const result = await fixture.service.testSendEmailTemplate(
      "auth.password_reset",
      "qa@example.com",
      auditContext,
    );
    expect(result.queued).toBe(true);
    expect(fixture.notificationRepository.enqueueEmail).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        templateKey: "auth.password_reset",
        toEmail: "qa@example.com",
        metadata: expect.objectContaining({ testSend: true }),
      }),
    );
  });

  it("retries and cancels background jobs with audit records", async () => {
    const fixture = createFixture({ roleKeys: ["platform_admin"] });

    const retried = await fixture.service.retryJob("job_1", auditContext);
    expect(retried.status).toBe("pending");
    const cancelled = await fixture.service.cancelJob("job_1", auditContext);
    expect(cancelled.status).toBe("cancelled");
    expect(fixture.operationsRepository.appendAuditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: "background_job.retried" }),
    );
    expect(fixture.operationsRepository.appendAuditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: "background_job.cancelled" }),
    );
  });

  it("returns security center and system health snapshots for authorized monitors", async () => {
    const fixture = createFixture({ roleKeys: ["auditor"] });

    const center = await fixture.service.getSecurityCenter();
    expect(center.securityEvents).toEqual(fixture.state.securityEvents);
    expect(center.adminActivity).toHaveLength(1);

    const health = await fixture.service.getSystemHealth();
    expect(health.application).toBe("ok");
    expect(health.queues.pendingJobs).toBe(1);
    expect(health.queues.failedJobs).toBe(2);
  });

  it("refuses to delete system roles or roles that still have assignments", async () => {
    const fixture = createFixture({ roleKeys: ["super_admin"] });

    await expect(fixture.service.deleteUnusedRole("role_system", auditContext)).rejects.toMatchObject({
      code: "AUTHORIZATION_ERROR",
    });

    await expect(fixture.service.deleteUnusedRole("role_used", auditContext)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });
});

interface FixtureOptions {
  authenticated?: boolean;
  roleKeys?: string[];
  permissionKeys?: string[];
}

function createFixture(options: FixtureOptions = {}) {
  const authenticated = options.authenticated ?? true;
  const roleKeys = options.roleKeys ?? ["super_admin"];
  const permissionKeys =
    options.permissionKeys ?? permissionKeysForRoles(roleKeys);

  const currentUser: AuthenticatedUser = {
    authUserId: "00000000-0000-0000-0000-000000000099",
    email: "admin@example.com",
    emailVerifiedAt: new Date("2026-07-13T12:00:00.000Z"),
    displayName: "Admin",
  };

  const adminAppUser = {
    id: "admin_1",
    authUserId: currentUser.authUserId,
    email: "admin@example.com",
    emailVerifiedAt: currentUser.emailVerifiedAt,
    status: "active" as const,
    createdAt: new Date("2026-07-13T12:00:00.000Z"),
    updatedAt: new Date("2026-07-13T12:00:00.000Z"),
  };

  const now = new Date("2026-07-13T12:00:00.000Z");

  const state = {
    emailTemplate: {
      key: "auth.password_reset",
      name: "Password Reset",
      description: "Password reset",
      status: "enabled" as "enabled" | "disabled",
      currentVersion: "v1",
      previewSample: {},
      updatedBy: null,
      createdAt: now,
      updatedAt: now,
    },
    securityEvents: [
      {
        id: "sec_1",
        userId: "staff_1",
        eventType: "auth.login_failed",
        severity: "warning" as const,
        metadata: {},
        createdAt: now,
      },
    ],
    auditLogs: [
      {
        id: "audit_1",
        actorUserId: "admin_1",
        actorType: "admin" as const,
        action: "role.created",
        targetType: "admin_system",
        targetId: "role_1",
        reason: null,
        metadata: {},
        requestId: "request_0",
        ipAddressHash: null,
        userAgentHash: null,
        createdAt: now,
      },
    ],
  };

  const identityProvider = {
    getCurrentUser: vi.fn(async () => (authenticated ? currentUser : null)),
    generatePasswordResetEmail: vi.fn(async () => ({ ok: true })),
  };

  const identityRepository = {
    findUserByAuthUserId: vi.fn(async (authUserId: string) =>
      authUserId === adminAppUser.authUserId ? adminAppUser : null,
    ),
    findUserById: vi.fn(async (userId: string) =>
      userId === "staff_1"
        ? {
            id: "staff_1",
            authUserId: "auth_staff",
            email: "staff@example.com",
            emailVerifiedAt: now,
            status: "active" as const,
            createdAt: now,
            updatedAt: now,
          }
        : userId === adminAppUser.id
          ? adminAppUser
          : null,
    ),
    findAdminProfileByUserId: vi.fn(async (userId: string) => {
      if (userId === adminAppUser.id) {
        return {
          id: "admin_profile_1",
          userId,
          status: "active" as const,
          mustChangePassword: false,
          lastActiveAt: now,
          disabledAt: null,
          disabledReason: null,
          createdAt: now,
          updatedAt: now,
        };
      }
      if (userId === "staff_1") {
        return {
          id: "staff_profile_1",
          userId,
          status: "active" as const,
          mustChangePassword: false,
          lastActiveAt: now,
          disabledAt: null,
          disabledReason: null,
          createdAt: now,
          updatedAt: now,
        };
      }
      return null;
    }),
    listActiveRoleKeysForUser: vi.fn(async (userId: string) =>
      userId === adminAppUser.id ? roleKeys : [],
    ),
    listActivePermissionKeysForUser: vi.fn(async (userId: string) =>
      userId === adminAppUser.id ? permissionKeys : [],
    ),
    listPermissions: vi.fn(async () => [
      { id: "perm_1", key: "customers.read", name: "Customers Read", description: null, createdAt: now },
    ]),
    listRoles: vi.fn(async () => []),
    findRoleById: vi.fn(async (roleId: string) => {
      if (roleId === "role_system") {
        return {
          id: roleId,
          key: "super_admin",
          name: "Super Admin",
          description: null,
          isSystem: true,
          status: "active",
          createdAt: now,
          updatedAt: now,
        };
      }
      if (roleId === "role_used") {
        return {
          id: roleId,
          key: "custom_used",
          name: "Used",
          description: null,
          isSystem: false,
          status: "active",
          createdAt: now,
          updatedAt: now,
        };
      }
      return null;
    }),
    createRole: vi.fn(async (_tx: unknown, values: { key: string; name: string }) => ({
      id: "role_new",
      key: values.key,
      name: values.name,
      description: null,
      isSystem: false,
      status: "active",
      createdAt: now,
      updatedAt: now,
    })),
    updateRole: vi.fn(async () => null),
    replaceRolePermissions: vi.fn(async () => undefined),
    listPermissionKeysForRole: vi.fn(async () => []),
    countActiveAssignmentsForRole: vi.fn(async (roleId: string) =>
      roleId === "role_used" ? 2 : 0,
    ),
    deleteRole: vi.fn(async () => undefined),
    createStaffInvite: vi.fn(async (_tx: unknown, values: { email: string }) => ({
      id: "invite_1",
      email: values.email,
      invitedBy: "admin_1",
      tokenHash: "hash",
      status: "pending" as const,
      expiresAt: new Date(now.getTime() + 86_400_000),
      acceptedUserId: null,
      acceptedAt: null,
      revokedAt: null,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    })),
    updateAdminProfile: vi.fn(
      async (_tx: unknown, userId: string, values: Record<string, unknown>) => ({
        id: "staff_profile_1",
        userId,
        status: (values.status as "active" | "suspended" | "deactivated") ?? "active",
        mustChangePassword: Boolean(values.mustChangePassword ?? false),
        lastActiveAt: now,
        disabledAt: (values.disabledAt as Date | null | undefined) ?? null,
        disabledReason: (values.disabledReason as string | null | undefined) ?? null,
        createdAt: now,
        updatedAt: now,
      }),
    ),
    listRoleIdsForUser: vi.fn(async () => ["role_1"]),
    replaceStaffRoles: vi.fn(async () => undefined),
    listSessionsByUserId: vi.fn(async () => []),
    revokeSession: vi.fn(async () => ({ id: "session_1", status: "revoked" })),
    listStaff: vi.fn(async () => []),
  };

  const operationsRepository = {
    appendAuditLog: vi.fn(async (_tx: unknown, values: Record<string, unknown>) => ({
      id: "audit_new",
      ...values,
      createdAt: now,
    })),
    listFeatureFlags: vi.fn(async () => []),
    listSystemSettings: vi.fn(async () => []),
    getFeatureFlag: vi.fn(async () => null),
    getSystemSetting: vi.fn(async () => null),
    upsertFeatureFlag: vi.fn(async (_tx: unknown, values: Record<string, unknown>) => ({
      id: "flag_1",
      ...values,
      createdAt: now,
      updatedAt: now,
    })),
    upsertSystemSetting: vi.fn(async (_tx: unknown, values: Record<string, unknown>) => ({
      ...values,
      createdAt: now,
      updatedAt: now,
    })),
    listEmailTemplates: vi.fn(async () => [state.emailTemplate]),
    getEmailTemplate: vi.fn(async (key: string) =>
      key === state.emailTemplate.key ? { ...state.emailTemplate } : null,
    ),
    updateEmailTemplate: vi.fn(
      async (_tx: unknown, key: string, values: { status: "enabled" | "disabled" }) => ({
        ...state.emailTemplate,
        key,
        status: values.status,
      }),
    ),
    listNotificationTemplates: vi.fn(async () => []),
    getNotificationTemplate: vi.fn(async () => null),
    updateNotificationTemplate: vi.fn(async () => null),
    listAuditLogs: vi.fn(async () => state.auditLogs),
    listSecurityEvents: vi.fn(async () => state.securityEvents),
    listBackgroundJobs: vi.fn(async () => ({ rows: [], nextCursor: null })),
    findBackgroundJobById: vi.fn(async (jobId: string) => ({
      id: jobId,
      status: "failed" as const,
      jobType: "demo",
      createdAt: now,
      updatedAt: now,
    })),
    retryBackgroundJob: vi.fn(async (_tx: unknown, jobId: string) => ({
      id: jobId,
      status: "pending" as const,
      jobType: "demo",
      createdAt: now,
      updatedAt: now,
    })),
    cancelBackgroundJob: vi.fn(async (_tx: unknown, jobId: string) => ({
      id: jobId,
      status: "cancelled" as const,
      jobType: "demo",
      createdAt: now,
      updatedAt: now,
    })),
    countBackgroundJobsByStatus: vi.fn(async (status: string) => {
      if (status === "pending") return 1;
      if (status === "failed") return 2;
      if (status === "running") return 0;
      return 0;
    }),
  };

  const notificationRepository = {
    enqueueOutboxEvent: vi.fn(async () => ({ id: "outbox_1" })),
    enqueueEmail: vi.fn(async () => ({ id: "email_1" })),
  };

  const transactionManager = {
    runInTransaction: vi.fn(async (fn: (tx: { db: unknown }) => Promise<unknown>) =>
      fn({ db: {} }),
    ),
  };

  const service = new AdminSystemService({
    identityProvider: identityProvider as never,
    clock: { now: () => now },
    transactionManager: transactionManager as never,
    identityRepository: identityRepository as never,
    operationsRepository: operationsRepository as never,
    notificationRepository: notificationRepository as never,
  });

  return {
    service,
    identityRepository,
    operationsRepository,
    notificationRepository,
    state,
  };
}

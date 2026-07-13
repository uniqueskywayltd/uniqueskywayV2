import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import type { IdentityProvider } from "@/application/auth";
import { AppError } from "@/application/errors";
import type { Clock } from "@/application/ports";
import type {
  DrizzleTransactionContext,
  DrizzleTransactionManager,
  IdentityRepository,
  NotificationRepository,
  OperationsRepository,
  PaymentRepository,
  RoleRecord,
} from "@/infrastructure/database";

import type { RequestAuditContext } from "./admin-customer-service";
import { requireAdminActor } from "./require-admin";

export interface AdminSystemServiceDependencies {
  identityProvider?: IdentityProvider;
  clock: Clock;
  transactionManager: DrizzleTransactionManager;
  identityRepository: IdentityRepository;
  operationsRepository: OperationsRepository;
  notificationRepository: NotificationRepository;
  paymentRepository?: PaymentRepository;
}

export interface SystemHealthView {
  application: "ok";
  version: string;
  gitCommit: string;
  releaseTag: string;
  database: "ok" | "unknown";
  queues: {
    pendingJobs: number;
    failedJobs: number;
    runningJobs: number;
  };
  webhooks: {
    failedProviderEvents: number;
    deadLetteredProviderEvents: number;
  };
  memory: NodeJS.MemoryUsage;
  loadAverage: number[];
  uptimeSeconds: number;
}

export class AdminSystemService {
  constructor(private readonly deps: AdminSystemServiceDependencies) {}

  async listPermissions() {
    await requireAdminActor(this.deps, "permissions.manage");
    return this.deps.identityRepository.listPermissions();
  }

  async listRoles() {
    await requireAdminActor(this.deps, "roles.manage");
    const roles = await this.deps.identityRepository.listRoles();
    return Promise.all(
      roles.map(async (role) => ({
        ...role,
        permissions: await this.deps.identityRepository.listPermissionKeysForRole(role.id),
      })),
    );
  }

  async getRole(roleId: string) {
    await requireAdminActor(this.deps, "roles.manage");
    const role = await this.deps.identityRepository.findRoleById(roleId);
    if (!role) throw new AppError({ code: "NOT_FOUND", message: "Role was not found." });
    return {
      ...role,
      permissions: await this.deps.identityRepository.listPermissionKeysForRole(role.id),
    };
  }

  async createRole(
    input: {
      key: string;
      name: string;
      description?: string | undefined;
      permissionKeys?: string[] | undefined;
    },
    context: RequestAuditContext,
  ) {
    const admin = await requireAdminActor(this.deps, "roles.manage");
    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const role = await this.deps.identityRepository.createRole(tx, {
        key: input.key,
        name: input.name,
        ...(input.description !== undefined ? { description: input.description } : {}),
        isSystem: false,
        status: "active",
      });
      if (input.permissionKeys?.length) {
        await this.deps.identityRepository.replaceRolePermissions(
          tx,
          role.id,
          input.permissionKeys,
          admin.appUser.id,
        );
      }
      await this.appendAdminAudit(tx, admin.appUser.id, "role.created", role.id, context, {
        permissionUsed: admin.permissionUsed,
        before: null,
        after: { key: role.key, name: role.name, permissions: input.permissionKeys ?? [] },
      });
      return role;
    });
  }

  async updateRole(
    roleId: string,
    input: {
      name?: string | undefined;
      description?: string | undefined;
      status?: string | undefined;
    },
    context: RequestAuditContext,
  ) {
    const admin = await requireAdminActor(this.deps, "roles.manage");
    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const existing = await this.deps.identityRepository.findRoleById(roleId);
      if (!existing) throw new AppError({ code: "NOT_FOUND", message: "Role was not found." });
      const patch: Partial<{ name: string; description: string; status: string }> = {};
      if (input.name !== undefined) patch.name = input.name;
      if (input.description !== undefined) patch.description = input.description;
      if (input.status !== undefined) patch.status = input.status;
      const updated = await this.deps.identityRepository.updateRole(tx, roleId, patch);
      await this.appendAdminAudit(tx, admin.appUser.id, "role.updated", roleId, context, {
        permissionUsed: admin.permissionUsed,
        before: existing,
        after: updated,
      });
      return updated;
    });
  }

  async cloneRole(roleId: string, input: { key: string; name: string }, context: RequestAuditContext) {
    await requireAdminActor(this.deps, "roles.manage");
    const sourcePermissions = await this.deps.identityRepository.listPermissionKeysForRole(roleId);
    return this.createRole(
      {
        key: input.key,
        name: input.name,
        description: `Cloned from ${roleId}`,
        permissionKeys: sourcePermissions,
      },
      context,
    );
  }

  async disableRole(roleId: string, context: RequestAuditContext) {
    const admin = await requireAdminActor(this.deps, "roles.manage");
    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const existing = await this.deps.identityRepository.findRoleById(roleId);
      if (!existing) throw new AppError({ code: "NOT_FOUND", message: "Role was not found." });
      if (existing.isSystem) {
        throw new AppError({
          code: "AUTHORIZATION_ERROR",
          message: "System roles cannot be disabled.",
        });
      }
      const updated = await this.deps.identityRepository.updateRole(tx, roleId, {
        status: "disabled",
      });
      await this.appendAdminAudit(tx, admin.appUser.id, "role.disabled", roleId, context, {
        permissionUsed: admin.permissionUsed,
        before: { status: existing.status },
        after: { status: updated.status },
      });
      return updated;
    });
  }

  async setRolePermissions(
    roleId: string,
    permissionKeys: string[],
    context: RequestAuditContext,
  ) {
    const admin = await requireAdminActor(this.deps, "roles.manage");
    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const existing = await this.deps.identityRepository.findRoleById(roleId);
      if (!existing) throw new AppError({ code: "NOT_FOUND", message: "Role was not found." });
      const before = await this.deps.identityRepository.listPermissionKeysForRole(roleId);
      await this.deps.identityRepository.replaceRolePermissions(
        tx,
        roleId,
        permissionKeys,
        admin.appUser.id,
      );
      await this.appendAdminAudit(tx, admin.appUser.id, "role.permissions_updated", roleId, context, {
        permissionUsed: admin.permissionUsed,
        before: { permissions: before },
        after: { permissions: permissionKeys },
      });
      return { roleId, permissions: permissionKeys };
    });
  }

  async searchStaff(
    input: { q?: string | undefined; status?: string | undefined; limit?: number | undefined } = {},
  ) {
    await requireAdminActor(this.deps, "staff.manage");
    const query: { q?: string; status?: string; limit?: number } = {};
    if (input.q !== undefined) query.q = input.q;
    if (input.status !== undefined) query.status = input.status;
    if (input.limit !== undefined) query.limit = input.limit;
    return this.deps.identityRepository.listStaff(query);
  }

  async inviteStaff(
    input: { email: string; roleIds: string[] },
    context: RequestAuditContext,
  ) {
    const admin = await requireAdminActor(this.deps, "staff.manage");
    const email = input.email.trim().toLowerCase();
    if (!email || input.roleIds.length === 0) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Staff invite requires an email and at least one role.",
      });
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(this.deps.clock.now().getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const invite = await this.deps.identityRepository.createStaffInvite(
        tx,
        {
          email,
          invitedBy: admin.appUser.id,
          tokenHash,
          status: "pending",
          expiresAt,
          metadata: {},
        },
        input.roleIds,
      );
      await this.deps.notificationRepository.enqueueOutboxEvent(tx, {
        eventType: "admin.staff.invite",
        aggregateType: "staff_invite",
        aggregateId: invite.id,
        payload: { email, roleIds: input.roleIds, inviteId: invite.id },
      });
      await this.appendAdminAudit(tx, admin.appUser.id, "staff.invited", invite.id, context, {
        permissionUsed: admin.permissionUsed,
        after: { email, roleIds: input.roleIds },
      });
      return { invite, inviteToken: token };
    });
  }

  async setStaffStatus(
    userId: string,
    input: {
      status: "active" | "suspended" | "deactivated";
      reason?: string | undefined;
    },
    context: RequestAuditContext,
  ) {
    const admin = await requireAdminActor(this.deps, "staff.manage");
    if (input.status !== "active" && !input.reason?.trim()) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "A reason is required when disabling staff.",
      });
    }
    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const before = await this.deps.identityRepository.findAdminProfileByUserId(userId);
      if (!before) throw new AppError({ code: "NOT_FOUND", message: "Staff profile was not found." });
      const updated = await this.deps.identityRepository.updateAdminProfile(tx, userId, {
        status: input.status,
        disabledAt: input.status === "active" ? null : this.deps.clock.now(),
        disabledReason: input.status === "active" ? null : (input.reason ?? null),
      });
      await this.appendAdminAudit(tx, admin.appUser.id, "staff.status_updated", userId, context, {
        permissionUsed: admin.permissionUsed,
        before: { status: before.status },
        after: { status: updated.status },
      }, input.reason);
      return updated;
    });
  }

  async getStaffDetails(userId: string) {
    await requireAdminActor(this.deps, "staff.manage");
    const user = await this.deps.identityRepository.findUserById(userId);
    if (!user) throw new AppError({ code: "NOT_FOUND", message: "Staff user was not found." });
    const adminProfile = await this.deps.identityRepository.findAdminProfileByUserId(userId);
    if (!adminProfile) {
      throw new AppError({ code: "NOT_FOUND", message: "Staff profile was not found." });
    }
    const [roleKeys, roleIds, sessions, loginHistory] = await Promise.all([
      this.deps.identityRepository.listActiveRoleKeysForUser(userId),
      this.deps.identityRepository.listRoleIdsForUser(userId),
      this.deps.identityRepository.listSessionsByUserId(userId),
      this.deps.operationsRepository.listSecurityEvents({ userId, limit: 50 }),
    ]);
    return {
      user,
      adminProfile,
      roleKeys,
      roleIds,
      sessions,
      loginHistory,
      lastActivityAt: adminProfile.lastActiveAt,
    };
  }

  async assignStaffRoles(
    userId: string,
    roleIds: string[],
    context: RequestAuditContext,
  ) {
    const admin = await requireAdminActor(this.deps, "staff.manage");
    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const before = await this.deps.identityRepository.listRoleIdsForUser(userId);
      await this.deps.identityRepository.replaceStaffRoles(
        tx,
        userId,
        roleIds,
        admin.appUser.id,
      );
      await this.appendAdminAudit(tx, admin.appUser.id, "staff.roles_assigned", userId, context, {
        permissionUsed: admin.permissionUsed,
        before: { roleIds: before },
        after: { roleIds },
      });
      return { userId, roleIds };
    });
  }

  async forcePasswordChange(userId: string, context: RequestAuditContext) {
    const admin = await requireAdminActor(this.deps, "staff.manage");
    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const before = await this.deps.identityRepository.findAdminProfileByUserId(userId);
      if (!before) throw new AppError({ code: "NOT_FOUND", message: "Staff profile was not found." });
      const updated = await this.deps.identityRepository.updateAdminProfile(tx, userId, {
        mustChangePassword: true,
      });
      await this.appendAdminAudit(tx, admin.appUser.id, "staff.force_password_change", userId, context, {
        permissionUsed: admin.permissionUsed,
        before: { mustChangePassword: before.mustChangePassword },
        after: { mustChangePassword: updated.mustChangePassword },
      });
      return updated;
    });
  }

  async lockStaffAccount(userId: string, reason: string, context: RequestAuditContext) {
    return this.setStaffStatus(userId, { status: "suspended", reason }, context);
  }

  async unlockStaffAccount(userId: string, context: RequestAuditContext) {
    return this.setStaffStatus(userId, { status: "active" }, context);
  }

  async revokeStaffSession(userId: string, sessionId: string, context: RequestAuditContext) {
    const admin = await requireAdminActor(this.deps, "staff.manage");
    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const sessions = await this.deps.identityRepository.listSessionsByUserId(userId);
      const before = sessions.find((session) => session.id === sessionId);
      if (!before) throw new AppError({ code: "NOT_FOUND", message: "Session was not found." });
      const revoked = await this.deps.identityRepository.revokeSession(
        tx,
        sessionId,
        this.deps.clock.now(),
      );
      await this.appendAdminAudit(tx, admin.appUser.id, "staff.session_revoked", userId, context, {
        permissionUsed: admin.permissionUsed,
        before: { sessionId, status: before.status },
        after: { sessionId, status: revoked.status },
      });
      return revoked;
    });
  }

  async deleteUnusedRole(roleId: string, context: RequestAuditContext) {
    const admin = await requireAdminActor(this.deps, "roles.manage");
    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const existing = await this.deps.identityRepository.findRoleById(roleId);
      if (!existing) throw new AppError({ code: "NOT_FOUND", message: "Role was not found." });
      if (existing.isSystem) {
        throw new AppError({
          code: "AUTHORIZATION_ERROR",
          message: "System roles cannot be deleted.",
        });
      }
      const assignments = await this.deps.identityRepository.countActiveAssignmentsForRole(roleId);
      if (assignments > 0) {
        throw new AppError({
          code: "VALIDATION_ERROR",
          message: "Only unused roles can be deleted.",
          details: { assignments },
        });
      }
      await this.deps.identityRepository.deleteRole(tx, roleId);
      await this.appendAdminAudit(tx, admin.appUser.id, "role.deleted", roleId, context, {
        permissionUsed: admin.permissionUsed,
        before: existing,
        after: null,
      });
      return { deleted: true, roleId };
    });
  }

  async listEmailTemplates() {
    await requireAdminActor(this.deps, "emails.manage");
    return this.deps.operationsRepository.listEmailTemplates();
  }

  async previewEmailTemplate(key: string) {
    await requireAdminActor(this.deps, "emails.manage");
    const template = await this.deps.operationsRepository.getEmailTemplate(key);
    if (!template) throw new AppError({ code: "NOT_FOUND", message: "Email template was not found." });
    return template;
  }

  async setEmailTemplateStatus(
    key: string,
    status: "enabled" | "disabled",
    context: RequestAuditContext,
  ) {
    const admin = await requireAdminActor(this.deps, "emails.manage");
    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const before = await this.deps.operationsRepository.getEmailTemplate(key);
      if (!before) throw new AppError({ code: "NOT_FOUND", message: "Email template was not found." });
      const updated = await this.deps.operationsRepository.updateEmailTemplate(tx, key, {
        status,
        updatedBy: admin.appUser.id,
      });
      await this.appendAdminAudit(tx, admin.appUser.id, "email_template.status_updated", key, context, {
        permissionUsed: admin.permissionUsed,
        before: { status: before.status },
        after: { status: updated.status },
      });
      return updated;
    });
  }

  async testSendEmailTemplate(key: string, toEmail: string, context: RequestAuditContext) {
    const admin = await requireAdminActor(this.deps, "emails.manage");
    const template = await this.deps.operationsRepository.getEmailTemplate(key);
    if (!template) throw new AppError({ code: "NOT_FOUND", message: "Email template was not found." });
    if (template.status !== "enabled") {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Only enabled email templates can be test-sent.",
      });
    }
    return this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.deps.notificationRepository.enqueueEmail(tx, {
        recipientUserId: null,
        toEmail,
        templateKey: template.key,
        templateVersion: template.currentVersion,
        idempotencyKey: `admin.email_template.test:${template.key}:${randomUUID()}`,
        metadata: {
          testSend: true,
          requestedBy: admin.appUser.id,
          previewSample: template.previewSample,
        },
      });
      await this.appendAdminAudit(tx, admin.appUser.id, "email_template.test_sent", key, context, {
        permissionUsed: admin.permissionUsed,
        after: { toEmail, templateVersion: template.currentVersion },
      });
      return { queued: true, templateKey: key, toEmail };
    });
  }

  async listNotificationTemplates() {
    await requireAdminActor(this.deps, "notifications.manage");
    return this.deps.operationsRepository.listNotificationTemplates();
  }

  async previewNotificationTemplate(key: string) {
    await requireAdminActor(this.deps, "notifications.manage");
    const template = await this.deps.operationsRepository.getNotificationTemplate(key);
    if (!template) {
      throw new AppError({ code: "NOT_FOUND", message: "Notification template was not found." });
    }
    return template;
  }

  async setNotificationTemplateStatus(
    key: string,
    status: "enabled" | "disabled",
    context: RequestAuditContext,
  ) {
    const admin = await requireAdminActor(this.deps, "notifications.manage");
    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const before = await this.deps.operationsRepository.getNotificationTemplate(key);
      if (!before) {
        throw new AppError({ code: "NOT_FOUND", message: "Notification template was not found." });
      }
      const updated = await this.deps.operationsRepository.updateNotificationTemplate(tx, key, {
        status,
        updatedBy: admin.appUser.id,
      });
      await this.appendAdminAudit(
        tx,
        admin.appUser.id,
        "notification_template.status_updated",
        key,
        context,
        {
          permissionUsed: admin.permissionUsed,
          before: { status: before.status },
          after: { status: updated.status },
        },
      );
      return updated;
    });
  }

  async testNotificationTemplate(key: string, userId: string, context: RequestAuditContext) {
    const admin = await requireAdminActor(this.deps, "notifications.manage");
    const template = await this.deps.operationsRepository.getNotificationTemplate(key);
    if (!template) {
      throw new AppError({ code: "NOT_FOUND", message: "Notification template was not found." });
    }
    if (template.status !== "enabled") {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Only enabled notification templates can be tested.",
      });
    }
    return this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.deps.notificationRepository.enqueueOutboxEvent(tx, {
        eventType: "admin.notification_template.test",
        aggregateType: "notification_template",
        aggregateId: template.key,
        payload: {
          userId,
          templateKey: template.key,
          channel: template.channel,
          previewSample: template.previewSample,
          requestedBy: admin.appUser.id,
        },
      });
      await this.appendAdminAudit(tx, admin.appUser.id, "notification_template.test", key, context, {
        permissionUsed: admin.permissionUsed,
        after: { userId, channel: template.channel },
      });
      return { queued: true, templateKey: key, userId };
    });
  }

  async resetStaffPassword(userId: string, context: RequestAuditContext) {
    const admin = await requireAdminActor(this.deps, "staff.reset_password");
    if (!this.deps.identityProvider?.generatePasswordResetEmail) {
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: "Password reset is unavailable.",
      });
    }
    const user = await this.deps.identityRepository.findUserById(userId);
    if (!user) throw new AppError({ code: "NOT_FOUND", message: "Staff user was not found." });

    const reset = await this.deps.identityProvider.generatePasswordResetEmail({
      email: user.email,
      redirectTo: process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
        : "http://localhost:3000/auth/reset-password",
    });

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.deps.identityRepository.updateAdminProfile(tx, userId, {
        mustChangePassword: true,
      });
      await this.deps.notificationRepository.enqueueEmail(tx, {
        recipientUserId: user.id,
        toEmail: user.email,
        templateKey: "auth.password_reset",
        templateVersion: "v1",
        idempotencyKey: `staff.password_reset:${user.id}:${randomUUID()}`,
        metadata: { resetRequestedBy: admin.appUser.id },
      });
      await this.appendAdminAudit(tx, admin.appUser.id, "staff.password_reset", userId, context, {
        permissionUsed: admin.permissionUsed,
      });
      return { userId, resetIssued: Boolean(reset) };
    });
  }

  async listFeatureFlags() {
    await requireAdminActor(this.deps, "featureflags.manage");
    return this.deps.operationsRepository.listFeatureFlags();
  }

  async upsertFeatureFlag(
    input: {
      key: string;
      status: "enabled" | "disabled";
      description?: string | undefined;
      rolloutPercent?: number | undefined;
      internalOnly?: boolean | undefined;
      scheduleStartAt?: Date | null | undefined;
      scheduleEndAt?: Date | null | undefined;
    },
    context: RequestAuditContext,
  ) {
    const admin = await requireAdminActor(this.deps, "featureflags.manage");
    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const before = await this.deps.operationsRepository.getFeatureFlag(input.key);
      const flag = await this.deps.operationsRepository.upsertFeatureFlag(tx, {
        key: input.key,
        status: input.status,
        ...(input.description !== undefined ? { description: input.description } : {}),
        rules: {},
        rolloutPercent: input.rolloutPercent ?? 100,
        internalOnly: input.internalOnly ?? false,
        scheduleStartAt: input.scheduleStartAt ?? null,
        scheduleEndAt: input.scheduleEndAt ?? null,
        enabledAt: input.status === "enabled" ? this.deps.clock.now() : null,
        disabledAt: input.status === "disabled" ? this.deps.clock.now() : null,
      });
      await this.appendAdminAudit(tx, admin.appUser.id, "feature_flag.upserted", input.key, context, {
        permissionUsed: admin.permissionUsed,
        before,
        after: flag,
      });
      return flag;
    });
  }

  async listSettings() {
    await requireAdminActor(this.deps, "system.manage");
    return this.deps.operationsRepository.listSystemSettings();
  }

  async upsertSetting(
    input: {
      key: string;
      value: Record<string, unknown> | string | number | boolean;
      description?: string | undefined;
    },
    context: RequestAuditContext,
  ) {
    const admin = await requireAdminActor(this.deps, "system.manage");
    const value =
      typeof input.value === "object" && input.value !== null && !Array.isArray(input.value)
        ? (input.value as Record<string, unknown>)
        : ({ value: input.value } as Record<string, unknown>);

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const before = await this.deps.operationsRepository.getSystemSetting(input.key);
      const setting = await this.deps.operationsRepository.upsertSystemSetting(tx, {
        key: input.key,
        value,
        ...(input.description !== undefined ? { description: input.description } : {}),
        updatedBy: admin.appUser.id,
      });
      await this.appendAdminAudit(tx, admin.appUser.id, "system_setting.upserted", input.key, context, {
        permissionUsed: admin.permissionUsed,
        before,
        after: setting,
      });
      return setting;
    });
  }

  async listAuditLogs(
    input: {
      action?: string | undefined;
      actorUserId?: string | undefined;
      targetType?: string | undefined;
      limit?: number | undefined;
    } = {},
  ) {
    await requireAdminActor(this.deps, "audit.read");
    const query: {
      action?: string;
      actorUserId?: string;
      targetType?: string;
      limit?: number;
    } = {};
    if (input.action !== undefined) query.action = input.action;
    if (input.actorUserId !== undefined) query.actorUserId = input.actorUserId;
    if (input.targetType !== undefined) query.targetType = input.targetType;
    if (input.limit !== undefined) query.limit = input.limit;
    return this.deps.operationsRepository.listAuditLogs(query);
  }

  async listSecurityEvents(
    input: {
      severity?: "info" | "warning" | "critical" | undefined;
      limit?: number | undefined;
    } = {},
  ) {
    await requireAdminActor(this.deps, "security.read");
    const query: { severity?: "info" | "warning" | "critical"; limit?: number } = {};
    if (input.severity !== undefined) query.severity = input.severity;
    if (input.limit !== undefined) query.limit = input.limit;
    return this.deps.operationsRepository.listSecurityEvents(query);
  }

  async getSecurityCenter() {
    await requireAdminActor(this.deps, "security.read");
    const [securityEvents, adminActivity] = await Promise.all([
      this.deps.operationsRepository.listSecurityEvents({ limit: 50 }),
      this.deps.operationsRepository.listAuditLogs({ limit: 50 }),
    ]);
    return {
      securityEvents,
      adminActivity: adminActivity.filter((row) => row.actorType === "admin"),
    };
  }

  async listJobs(
    input: {
      status?: "pending" | "running" | "completed" | "failed" | "cancelled" | undefined;
      limit?: number | undefined;
    } = {},
  ) {
    await requireAdminActor(this.deps, "jobs.manage");
    const query: {
      status?: "pending" | "running" | "completed" | "failed" | "cancelled";
      limit: number;
    } = {
      limit: input.limit ?? 50,
    };
    if (input.status !== undefined) query.status = input.status;
    return this.deps.operationsRepository.listBackgroundJobs(query);
  }

  async retryJob(jobId: string, context: RequestAuditContext) {
    const admin = await requireAdminActor(this.deps, "jobs.manage");
    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const before = await this.deps.operationsRepository.findBackgroundJobById(jobId);
      if (!before) throw new AppError({ code: "NOT_FOUND", message: "Background job was not found." });
      const job = await this.deps.operationsRepository.retryBackgroundJob(tx, jobId);
      await this.appendAdminAudit(tx, admin.appUser.id, "background_job.retried", jobId, context, {
        permissionUsed: admin.permissionUsed,
        before: { status: before.status },
        after: { status: job.status },
      });
      return job;
    });
  }

  async cancelJob(jobId: string, context: RequestAuditContext) {
    const admin = await requireAdminActor(this.deps, "jobs.manage");
    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const before = await this.deps.operationsRepository.findBackgroundJobById(jobId);
      if (!before) throw new AppError({ code: "NOT_FOUND", message: "Background job was not found." });
      const job = await this.deps.operationsRepository.cancelBackgroundJob(tx, jobId);
      await this.appendAdminAudit(tx, admin.appUser.id, "background_job.cancelled", jobId, context, {
        permissionUsed: admin.permissionUsed,
        before: { status: before.status },
        after: { status: job.status },
      });
      return job;
    });
  }

  async getSystemHealth(): Promise<SystemHealthView> {
    await requireAdminActor(this.deps, "monitoring.read");
    const [pendingJobs, failedJobs, runningJobs] = await Promise.all([
      this.deps.operationsRepository.countBackgroundJobsByStatus("pending"),
      this.deps.operationsRepository.countBackgroundJobsByStatus("failed"),
      this.deps.operationsRepository.countBackgroundJobsByStatus("running"),
    ]);

    let failedProviderEvents = 0;
    let deadLetteredProviderEvents = 0;
    if (this.deps.paymentRepository?.countProviderEvents) {
      failedProviderEvents = await this.deps.paymentRepository.countProviderEvents({
        status: "failed",
      });
      deadLetteredProviderEvents = await this.deps.paymentRepository.countProviderEvents({
        deadLetteredOnly: true,
      });
    }

    return {
      application: "ok",
      version: readPackageVersion(),
      gitCommit: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT ?? "unknown",
      releaseTag: process.env.VERCEL_GIT_COMMIT_REF ?? process.env.RELEASE_TAG ?? "unknown",
      database: "ok",
      queues: { pendingJobs, failedJobs, runningJobs },
      webhooks: { failedProviderEvents, deadLetteredProviderEvents },
      memory: process.memoryUsage(),
      loadAverage: os.loadavg(),
      uptimeSeconds: process.uptime(),
    };
  }

  private async appendAdminAudit(
    tx: DrizzleTransactionContext,
    actorUserId: string,
    action: string,
    targetId: string,
    context: RequestAuditContext,
    metadata: Record<string, unknown> = {},
    reason?: string,
  ) {
    await this.deps.operationsRepository.appendAuditLog(tx, {
      actorUserId,
      actorType: "admin",
      action,
      targetType: "admin_system",
      targetId,
      reason: reason ?? null,
      metadata,
      requestId: context.requestId,
      ipAddressHash: context.ipAddressHash,
      userAgentHash: context.userAgentHash,
    });
  }
}

function readPackageVersion() {
  try {
    const packageJson = JSON.parse(
      readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
    ) as { version?: string };
    return packageJson.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export type { RoleRecord };

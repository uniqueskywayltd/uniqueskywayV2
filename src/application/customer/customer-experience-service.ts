import "server-only";

import { AppError } from "@/application/errors";
import type { IdentityProvider } from "@/application/auth";
import type { ObjectStorage } from "@/application/ports";
import type {
  CoreRepository,
  DrizzleTransactionContext,
  DrizzleTransactionManager,
  IdentityRepository,
  NotificationRepository,
  OperationsRepository,
} from "@/infrastructure/database";

import type {
  ListNotificationsInput,
  MarkNotificationReadInput,
  UpdateCustomerPreferencesInput,
  UpdateCustomerProfileInput,
} from "./schemas";
import {
  classifyNotificationType,
  isNewYorkToday,
  resolveNotificationHref,
  sortPresentedNotifications,
} from "./communication-presentation";

const AVATAR_BUCKET = "customer-avatars";
const AVATAR_CONTENT_TYPE = "image/webp";
const MAX_AVATAR_BYTES = 1_000_000;
const DEFAULT_NOTIFICATION_TOPICS = ["account", "security", "product"] as const;

export interface CustomerExperienceServiceDependencies {
  identityProvider: IdentityProvider;
  transactionManager: DrizzleTransactionManager;
  identityRepository: IdentityRepository;
  coreRepository: CoreRepository;
  notificationRepository: NotificationRepository;
  operationsRepository: OperationsRepository;
  objectStorage: ObjectStorage;
}

export class CustomerExperienceService {
  constructor(private readonly deps: CustomerExperienceServiceDependencies) {}

  async getCustomerSummary() {
    const appUser = await this.requireCurrentAppUser();
    const [profile, account, preferences, unreadCount, notificationPreferences] = await Promise.all(
      [
        this.deps.coreRepository.findCustomerProfileByUserId(appUser.id),
        this.deps.coreRepository.findCustomerAccountByUserId(appUser.id),
        this.deps.coreRepository.findCustomerPreferencesByUserId(appUser.id),
        this.deps.notificationRepository.countUnreadNotificationsByUserId(appUser.id),
        this.deps.notificationRepository.listNotificationPreferencesByUserId(appUser.id),
      ],
    );

    return {
      user: {
        id: appUser.id,
        email: appUser.email,
        emailVerifiedAt: appUser.emailVerifiedAt,
        status: appUser.status,
      },
      profile: profile
        ? {
            ...profile,
            avatarUrl: profile.avatarStoragePath
              ? this.deps.objectStorage.getPublicUrl(AVATAR_BUCKET, profile.avatarStoragePath)
              : null,
          }
        : null,
      account,
      preferences: preferences ?? createDefaultPreferences(appUser.id),
      notificationPreferences: mergeNotificationPreferences(notificationPreferences),
      unreadNotificationCount: unreadCount,
    };
  }

  async updateProfile(input: UpdateCustomerProfileInput, context: RequestAuditContext) {
    const appUser = await this.requireCurrentAppUser();

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.deps.coreRepository.ensureCustomerProfile(tx, {
        userId: appUser.id,
        displayName: input.displayName ?? null,
        onboardingStatus: "not_started",
        kycStatus: "not_started",
        riskStatus: "not_reviewed",
      });

      const profile = await this.deps.coreRepository.updateCustomerProfile(tx, appUser.id, {
        legalName: normalizeOptional(input.legalName),
        displayName: normalizeOptional(input.displayName),
        phone: normalizeOptional(input.phone),
        country: normalizeOptional(input.country)?.toUpperCase() ?? null,
        stateRegion: normalizeOptional(input.stateRegion),
        dateOfBirth: normalizeOptional(input.dateOfBirth),
      });

      await this.appendAudit(
        tx,
        appUser.id,
        "customer.profile_updated",
        "customer_profile",
        profile.id,
        context,
      );

      return profile;
    });
  }

  async uploadAvatar(input: AvatarUploadInput, context: RequestAuditContext) {
    const appUser = await this.requireCurrentAppUser();

    if (input.contentType !== AVATAR_CONTENT_TYPE) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Avatar must be uploaded as a WebP image.",
      });
    }

    if (input.body.byteLength > MAX_AVATAR_BYTES) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Avatar must be 1 MB or smaller after compression.",
      });
    }

    const path = `avatars/${appUser.id}/${Date.now()}.webp`;
    const stored = await this.deps.objectStorage.upload({
      bucket: AVATAR_BUCKET,
      path,
      body: input.body,
      contentType: input.contentType,
      cacheControl: "31536000",
      upsert: true,
    });

    const profile = await this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.deps.coreRepository.ensureCustomerProfile(tx, {
        userId: appUser.id,
        onboardingStatus: "not_started",
        kycStatus: "not_started",
        riskStatus: "not_reviewed",
      });

      const updatedProfile = await this.deps.coreRepository.updateCustomerAvatar(tx, appUser.id, {
        avatarStoragePath: stored.path,
        avatarContentType: input.contentType,
        avatarUpdatedAt: new Date(),
      });

      await this.appendAudit(
        tx,
        appUser.id,
        "customer.avatar_updated",
        "customer_profile",
        updatedProfile.id,
        context,
      );

      return updatedProfile;
    });

    return {
      profile,
      avatarUrl: stored.publicUrl,
    };
  }

  async updatePreferences(input: UpdateCustomerPreferencesInput, context: RequestAuditContext) {
    const appUser = await this.requireCurrentAppUser();

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.deps.coreRepository.ensureCustomerPreferences(tx, {
        userId: appUser.id,
      });

      const preferences = await this.deps.coreRepository.updateCustomerPreferences(tx, appUser.id, {
        appearance: input.appearance,
        language: input.language,
        timeZone: input.timeZone,
        inAppNotificationsEnabled: input.inAppNotificationsEnabled,
        securityEmailsEnabled: input.securityEmailsEnabled,
        productEmailsEnabled: input.productEmailsEnabled,
        marketingEmailsEnabled: input.marketingEmailsEnabled,
      });

      await this.syncNotificationPreferences(tx, appUser.id, preferences);
      await this.appendAudit(
        tx,
        appUser.id,
        "customer.preferences_updated",
        "customer_preferences",
        preferences.id,
        context,
      );

      return {
        preferences,
        notificationPreferences: preferencesToNotificationPreferences(preferences),
      };
    });
  }

  async listNotifications(input: ListNotificationsInput) {
    const appUser = await this.requireCurrentAppUser();
    const notificationQuery = {
      userId: appUser.id,
      ...(input.query ? { query: input.query } : {}),
      ...(input.unreadOnly === undefined ? {} : { unreadOnly: input.unreadOnly }),
      limit: 100,
    };

    const [rows, unreadCount] = await Promise.all([
      this.deps.notificationRepository.listNotificationsByUserId(notificationQuery),
      this.deps.notificationRepository.countUnreadNotificationsByUserId(appUser.id),
    ]);

    let notifications = rows.map((notification) => {
      const category = classifyNotificationType(notification.type);
      return {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        priority: notification.priority,
        category,
        data: notification.data,
        href: resolveNotificationHref(notification.type, notification.data),
        readAt: notification.readAt,
        createdAt: notification.createdAt,
        isToday: isNewYorkToday(notification.createdAt),
      };
    });

    if (input.category && input.category !== "all") {
      notifications = notifications.filter((item) => item.category === input.category);
    }

    return {
      notifications: sortPresentedNotifications(notifications),
      unreadCount,
    };
  }

  async markNotificationRead(input: MarkNotificationReadInput, context: RequestAuditContext) {
    const appUser = await this.requireCurrentAppUser();

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      if (input.markAll) {
        const updated = await this.deps.notificationRepository.markAllNotificationsRead(
          tx,
          appUser.id,
          new Date(),
        );
        await this.appendAudit(
          tx,
          appUser.id,
          "customer.notifications_mark_all_read",
          "notification",
          appUser.id,
          context,
        );
        return { markAll: true as const, updatedCount: updated, notification: null };
      }

      const notification = await this.deps.notificationRepository.markNotificationRead(
        tx,
        appUser.id,
        input.notificationId!,
        new Date(),
      );
      await this.appendAudit(
        tx,
        appUser.id,
        "customer.notification_read",
        "notification",
        notification.id,
        context,
      );
      return { markAll: false as const, updatedCount: 1, notification };
    });
  }

  async listActivity() {
    const appUser = await this.requireCurrentAppUser();
    const [auditLogs, securityEvents] = await Promise.all([
      this.deps.operationsRepository.listAuditLogsByActorUserId(appUser.id, 40),
      this.deps.operationsRepository.listSecurityEventsByUserId(appUser.id, 20),
    ]);

    return [...auditLogs.map(toAuditActivity), ...securityEvents.map(toSecurityActivity)]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, 50);
  }

  private async requireCurrentAppUser() {
    const currentUser = await this.deps.identityProvider.getCurrentUser();

    if (!currentUser) {
      throw new AppError({ code: "AUTHENTICATION_ERROR", message: "Authentication is required." });
    }

    const appUser = await this.deps.identityRepository.findUserByAuthUserId(currentUser.authUserId);

    if (!appUser) {
      throw new AppError({
        code: "AUTHENTICATION_ERROR",
        message: "Authenticated user is not registered.",
      });
    }

    return appUser;
  }

  private async syncNotificationPreferences(
    tx: DrizzleTransactionContext,
    userId: string,
    preferences: CustomerPreferencesForSync,
  ) {
    for (const topic of DEFAULT_NOTIFICATION_TOPICS) {
      await this.deps.notificationRepository.upsertNotificationPreference(tx, {
        userId,
        channel: "in_app",
        topic,
        enabled: preferences.inAppNotificationsEnabled,
      });
    }

    await this.deps.notificationRepository.upsertNotificationPreference(tx, {
      userId,
      channel: "email",
      topic: "security",
      enabled: preferences.securityEmailsEnabled,
    });
    await this.deps.notificationRepository.upsertNotificationPreference(tx, {
      userId,
      channel: "email",
      topic: "product",
      enabled: preferences.productEmailsEnabled,
    });
    await this.deps.notificationRepository.upsertNotificationPreference(tx, {
      userId,
      channel: "email",
      topic: "marketing",
      enabled: preferences.marketingEmailsEnabled,
    });
  }

  private async appendAudit(
    tx: DrizzleTransactionContext,
    actorUserId: string,
    action: string,
    targetType: string,
    targetId: string,
    context: RequestAuditContext,
  ) {
    await this.deps.operationsRepository.appendAuditLog(tx, {
      actorUserId,
      actorType: "customer",
      action,
      targetType,
      targetId,
      requestId: context.requestId,
      ipAddressHash: context.ipAddressHash,
      userAgentHash: context.userAgentHash,
    });
  }
}

export interface RequestAuditContext {
  requestId: string;
  ipAddressHash: string | null;
  userAgentHash: string | null;
}

export interface AvatarUploadInput {
  body: ArrayBuffer;
  contentType: string;
}

function createDefaultPreferences(userId: string) {
  return {
    id: null,
    userId,
    appearance: "system",
    language: "en",
    timeZone: "America/New_York",
    inAppNotificationsEnabled: true,
    securityEmailsEnabled: true,
    productEmailsEnabled: true,
    marketingEmailsEnabled: false,
    createdAt: null,
    updatedAt: null,
  } as const;
}

interface CustomerPreferencesForSync {
  inAppNotificationsEnabled: boolean;
  securityEmailsEnabled: boolean;
  productEmailsEnabled: boolean;
  marketingEmailsEnabled: boolean;
}

function mergeNotificationPreferences(
  preferences: Array<{ channel: string; topic: string; enabled: boolean }>,
) {
  const byKey = new Map(
    preferences.map((preference) => [
      `${preference.channel}:${preference.topic}`,
      preference.enabled,
    ]),
  );

  return {
    inApp: Object.fromEntries(
      DEFAULT_NOTIFICATION_TOPICS.map((topic) => [topic, byKey.get(`in_app:${topic}`) ?? true]),
    ),
    email: {
      security: byKey.get("email:security") ?? true,
      product: byKey.get("email:product") ?? true,
      marketing: byKey.get("email:marketing") ?? false,
    },
  };
}

function preferencesToNotificationPreferences(preferences: CustomerPreferencesForSync) {
  return {
    inApp: Object.fromEntries(
      DEFAULT_NOTIFICATION_TOPICS.map((topic) => [topic, preferences.inAppNotificationsEnabled]),
    ),
    email: {
      security: preferences.securityEmailsEnabled,
      product: preferences.productEmailsEnabled,
      marketing: preferences.marketingEmailsEnabled,
    },
  };
}

function normalizeOptional(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toAuditActivity(record: {
  id: string;
  action: string;
  targetType: string;
  createdAt: Date;
}) {
  const financial = /deposit|withdrawal|investment|ledger|wallet|payment|roi/i.test(
    `${record.action} ${record.targetType}`,
  );
  return {
    id: `audit:${record.id}`,
    type: "audit",
    category: financial ? ("financial" as const) : ("account" as const),
    title: formatAction(record.action),
    detail: record.targetType,
    createdAt: record.createdAt,
  };
}

function toSecurityActivity(record: {
  id: string;
  eventType: string;
  severity: string;
  createdAt: Date;
}) {
  return {
    id: `security:${record.id}`,
    type: "security",
    category: "security" as const,
    title: formatAction(record.eventType),
    detail: record.severity,
    createdAt: record.createdAt,
  };
}

function formatAction(action: string): string {
  return action
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

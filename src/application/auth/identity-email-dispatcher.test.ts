import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { EmailSender } from "@/application/ports";
import type {
  DrizzleTransactionContext,
  DrizzleTransactionManager,
  EmailMessageRecord,
  NotificationRepository,
} from "@/infrastructure/database";

import { AUTH_EMAIL_TEMPLATES } from "./constants";
import { IdentityEmailDispatcher } from "./identity-email-dispatcher";

const serverEnv = {
  NODE_ENV: "test",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  DATABASE_URL: "postgres://postgres:postgres@localhost:5432/unique_sky_way_v2",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  RESEND_API_KEY: "resend-key",
  RESEND_FROM_EMAIL: "security@uniqueskyway.example",
  INTERNAL_JOB_TOKEN: "development-job-token",
  LOG_LEVEL: "info",
};

describe("IdentityEmailDispatcher", () => {
  beforeEach(() => {
    for (const [key, value] of Object.entries(serverEnv)) {
      vi.stubEnv(key, value);
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders and sends queued identity emails asynchronously", async () => {
    const message = createEmailMessage({
      id: "email_1",
      templateKey: AUTH_EMAIL_TEMPLATES.verifyEmail,
    });
    const notifications = {
      listQueuedIdentityEmails: vi.fn(async () => [message]),
      markEmailSending: vi.fn(async () => message),
      markEmailSent: vi.fn(async () => message),
      markEmailFailed: vi.fn(async () => message),
    };
    const emailSender = {
      send: vi.fn(async () => ({ providerMessageId: "resend_message_1" })),
    };
    const dispatcher = new IdentityEmailDispatcher(
      notifications as unknown as NotificationRepository,
      createTransactionManager(),
      emailSender as unknown as EmailSender,
    );

    const result = await dispatcher.dispatchQueued(5);

    expect(result).toEqual({ processed: 1, sent: 1, failed: 0, skipped: 0 });
    expect(notifications.markEmailSending).toHaveBeenCalledWith(expect.anything(), "email_1");
    expect(emailSender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Unique Sky Way <info@uniqueskyway.com>",
        to: "investor@example.com",
        subject: "Verify your Unique Sky Way email",
        idempotencyKey: "auth.verify_email:user_1",
        headers: { "Reply-To": "info@uniqueskyway.com" },
        tags: [
          { name: "category", value: "identity" },
          { name: "template", value: "auth_verify_email" },
        ],
      }),
    );
    expect(notifications.markEmailSent).toHaveBeenCalledWith(
      expect.anything(),
      "email_1",
      "resend_message_1",
    );
    expect(notifications.markEmailFailed).not.toHaveBeenCalled();
  });

  it("marks failed deliveries without stopping the dispatcher", async () => {
    const message = createEmailMessage({
      id: "email_2",
      templateKey: AUTH_EMAIL_TEMPLATES.passwordReset,
    });
    const notifications = {
      listQueuedIdentityEmails: vi.fn(async () => [message]),
      markEmailSending: vi.fn(async () => message),
      markEmailSent: vi.fn(async () => message),
      markEmailFailed: vi.fn(async () => message),
    };
    const emailSender = {
      send: vi.fn(async () => {
        throw new Error("provider unavailable");
      }),
    };
    const dispatcher = new IdentityEmailDispatcher(
      notifications as unknown as NotificationRepository,
      createTransactionManager(),
      emailSender as unknown as EmailSender,
    );

    const result = await dispatcher.dispatchQueued(5);

    expect(result).toEqual({ processed: 1, sent: 0, failed: 1, skipped: 0 });
    expect(notifications.markEmailSent).not.toHaveBeenCalled();
    expect(notifications.markEmailFailed).toHaveBeenCalledWith(
      expect.anything(),
      "email_2",
      "provider unavailable",
    );
  });
});

function createTransactionManager(): DrizzleTransactionManager {
  const context = { db: {}, transactionId: "tx_email_dispatch" } as DrizzleTransactionContext;

  return {
    runInTransaction: vi.fn((callback: (tx: DrizzleTransactionContext) => unknown) =>
      callback(context),
    ),
  } as unknown as DrizzleTransactionManager;
}

function createEmailMessage(overrides: Partial<EmailMessageRecord> = {}): EmailMessageRecord {
  const now = new Date("2026-07-12T12:00:00.000Z");

  return {
    id: "email_1",
    recipientUserId: "user_1",
    toEmail: "investor@example.com",
    templateKey: AUTH_EMAIL_TEMPLATES.verifyEmail,
    templateVersion: "v1",
    idempotencyKey: "auth.verify_email:user_1",
    providerMessageId: null,
    status: "queued",
    attemptCount: 0,
    lastError: null,
    metadata: {
      otp: "123456",
      actionLink: "https://example.supabase.co/auth/verify",
    },
    createdAt: now,
    sentAt: null,
    updatedAt: now,
    ...overrides,
  };
}

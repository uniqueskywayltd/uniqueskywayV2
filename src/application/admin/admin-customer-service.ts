import "server-only";

import { randomBytes, randomUUID } from "node:crypto";

import type { IdentityProvider } from "@/application/auth";
import { AUTH_EMAIL_TEMPLATES, AUTH_ROUTES } from "@/application/auth/constants";
import { CustomerIdentityBootstrapService } from "@/application/auth/profile-bootstrap";
import {
  hashIpAddress,
  hashUserAgent,
  type RequestSecurityContext,
} from "@/application/auth/security";
import { AppError } from "@/application/errors";
import { getServerEnv } from "@/config/server-env";
import { resolvePublicAppUrl } from "@/config/public-app-url";
import { assertBalancedLedgerPosting } from "@/domains/ledger/posting";
import type {
  AuditLogRecord,
  CoreRepository,
  CustomerAccountRecord,
  CustomerNoteRecord,
  CustomerProfileRecord,
  CustomerSearchRow,
  DrizzleTransactionContext,
  DrizzleTransactionManager,
  IdentityRepository,
  LedgerRepository,
  NotificationRepository,
  OperationsRepository,
  UserRecord,
} from "@/infrastructure/database";

import { requireAdminActor } from "./require-admin";
import type {
  AddCustomerNoteInput,
  AdminCreateCustomerInput,
  AdminWalletAdjustmentInput,
  BulkCustomerActionInput,
  SearchCustomersInput,
  UpdateCustomerKycInput,
  UpdateCustomerProfileInput,
  UpdateCustomerStatusInput,
} from "./schemas";

export interface AdminCustomerServiceDependencies {
  identityProvider?: IdentityProvider;
  transactionManager: DrizzleTransactionManager;
  identityRepository: IdentityRepository;
  coreRepository: CoreRepository;
  operationsRepository: OperationsRepository;
  ledgerRepository: LedgerRepository;
  notificationRepository: NotificationRepository;
}

export interface RequestAuditContext {
  requestId: string;
  ipAddressHash: string | null;
  userAgentHash: string | null;
}

export interface CustomerDetails {
  user: UserRecord;
  profile: CustomerProfileRecord | null;
  account: CustomerAccountRecord | null;
}

export interface SearchCustomersResultView {
  rows: CustomerSearchRow[];
  nextCursor: string | null;
}

export class AdminCustomerService {
  private readonly bootstrapper: CustomerIdentityBootstrapService;

  constructor(private readonly deps: AdminCustomerServiceDependencies) {
    this.bootstrapper = new CustomerIdentityBootstrapService(
      deps.coreRepository,
      deps.ledgerRepository,
    );
  }

  async searchCustomers(input: SearchCustomersInput): Promise<SearchCustomersResultView> {
    await requireAdminActor(this.deps, "customers.read");

    return this.deps.coreRepository.searchCustomers({
      ...(input.q ? { q: input.q } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.kycStatus ? { kycStatus: input.kycStatus } : {}),
      limit: input.limit,
      ...(input.cursor ? { cursor: input.cursor } : {}),
    });
  }

  async getCustomerDetails(userId: string): Promise<CustomerDetails> {
    await requireAdminActor(this.deps, "customers.read");
    return this.loadCustomerDetails(userId);
  }

  async createCustomer(
    input: AdminCreateCustomerInput,
    context: RequestAuditContext,
  ): Promise<CustomerDetails & { temporaryPassword: string }> {
    const admin = await requireAdminActor(this.deps, "customers.update");
    if (!this.deps.identityProvider?.adminCreateUser) {
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: "Admin customer provisioning is unavailable.",
      });
    }

    const email = input.email.trim().toLowerCase();
    const existing = await this.deps.identityRepository.findUserByEmail(email);
    if (existing) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Email already registered.",
      });
    }

    if (input.username.trim()) {
      const existingUsername = await this.deps.coreRepository.findCustomerProfileByDisplayName(
        input.username.trim(),
      );
      if (existingUsername) {
        throw new AppError({
          code: "VALIDATION_ERROR",
          message: "Username already taken.",
        });
      }
    }

    const temporaryPassword = input.password.trim();
    const displayName = input.displayName?.trim() || input.username.trim();
    const legalName = input.legalName.trim();
    const username = input.username.trim();

    const created = await this.deps.identityProvider.adminCreateUser({
      email,
      password: temporaryPassword,
      displayName,
      emailConfirmed: true,
      mustChangePassword: true,
    });

    try {
      const details = await this.deps.transactionManager.runInTransaction(async (tx) => {
        const appUser = await this.deps.identityRepository.ensureUser(tx, {
          authUserId: created.authUserId,
          email: created.email.toLowerCase(),
          emailVerifiedAt: new Date(),
          status: "active",
        });

        await this.bootstrapper.bootstrap(tx, {
          userId: appUser.id,
          displayName: username,
          legalName,
        });

        const appUrl = resolvePublicAppUrl(getServerEnv().NEXT_PUBLIC_APP_URL);
        const loginUrl = `${appUrl}${AUTH_ROUTES.login}`;

        await this.deps.notificationRepository.enqueueEmail(tx, {
          recipientUserId: appUser.id,
          toEmail: appUser.email,
          templateKey: AUTH_EMAIL_TEMPLATES.welcome,
          templateVersion: "v1",
          idempotencyKey: `admin.customer.welcome:${appUser.id}:${randomUUID()}`,
          metadata: {
            adminCreated: true,
            temporaryPassword,
            mustChangePassword: true,
            loginUrl,
            email: appUser.email,
            username,
            firstName: legalName.split(" ")[0] ?? displayName,
            name: legalName,
            displayName: username,
          },
        });

        await this.appendAdminAudit(tx, admin.appUser.id, "customer.created", appUser.id, context, {
          email: appUser.email,
          createdByAdmin: true,
          mustChangePassword: true,
        });

        return this.loadCustomerDetailsInTx(tx, appUser.id);
      });

      return { ...details, temporaryPassword };
    } catch (error) {
      await this.deps.identityProvider.adminDeleteUser?.(created.authUserId).catch(() => undefined);
      throw error;
    }
  }

  async updateCustomerProfile(
    userId: string,
    input: UpdateCustomerProfileInput,
    context: RequestAuditContext,
  ): Promise<CustomerDetails> {
    const admin = await requireAdminActor(this.deps, "customers.update");
    const user = await this.deps.identityRepository.findUserById(userId);
    if (!user) {
      throw new AppError({ code: "NOT_FOUND", message: "Customer was not found." });
    }

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const profile = await this.deps.coreRepository.updateCustomerProfile(tx, userId, {
        ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
        ...(input.legalName !== undefined ? { legalName: input.legalName } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.country !== undefined ? { country: input.country } : {}),
        ...(input.stateRegion !== undefined ? { stateRegion: input.stateRegion } : {}),
      });

      await this.appendAdminAudit(tx, admin.appUser.id, "customer.updated", userId, context, {
        after: input,
      });

      const account = await this.deps.coreRepository.findCustomerAccountByUserId(userId);
      return { user, profile, account };
    });
  }

  async updateCustomerStatus(
    userId: string,
    input: UpdateCustomerStatusInput,
    context: RequestAuditContext,
  ): Promise<CustomerDetails> {
    const admin = await requireAdminActor(this.deps, "customers.suspend");

    const reason = input.reason?.trim() ?? null;
    if ((input.status === "restricted" || input.status === "closed") && !reason) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "A reason is required to restrict or close a customer account.",
      });
    }

    const user = await this.deps.identityRepository.findUserById(userId);
    if (!user) {
      throw new AppError({ code: "NOT_FOUND", message: "Customer was not found." });
    }

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const updatedUser = await this.deps.identityRepository.updateUserStatus(
        tx,
        userId,
        input.status,
      );
      const account = await this.deps.coreRepository.updateCustomerAccountStatus(tx, userId, {
        status: input.status,
        restrictionReason: reason,
        closedAt: input.status === "closed" ? new Date() : null,
      });

      await this.appendAdminAudit(
        tx,
        admin.appUser.id,
        "customer.status_updated",
        userId,
        context,
        { status: input.status, previousStatus: user.status, reason },
        reason,
      );

      const profile = await this.deps.coreRepository.findCustomerProfileByUserId(userId);
      return { user: updatedUser, profile, account };
    });
  }

  async lockCustomer(
    userId: string,
    reason: string,
    context: RequestAuditContext,
  ): Promise<CustomerDetails> {
    return this.updateCustomerStatus(userId, { status: "restricted", reason }, context);
  }

  async unlockCustomer(userId: string, context: RequestAuditContext): Promise<CustomerDetails> {
    return this.updateCustomerStatus(
      userId,
      { status: "active", reason: "Administrative unlock" },
      context,
    );
  }

  async resetCustomerPassword(
    userId: string,
    context: RequestAuditContext,
  ): Promise<{ temporaryPassword: string }> {
    const admin = await requireAdminActor(this.deps, "customers.update");
    if (!this.deps.identityProvider?.adminUpdatePassword) {
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: "Admin password reset is unavailable.",
      });
    }

    const user = await this.deps.identityRepository.findUserById(userId);
    if (!user) {
      throw new AppError({ code: "NOT_FOUND", message: "Customer was not found." });
    }

    const temporaryPassword = generateTemporaryPassword();
    await this.deps.identityProvider.adminUpdatePassword(user.authUserId, temporaryPassword);

    const appUrl = resolvePublicAppUrl(getServerEnv().NEXT_PUBLIC_APP_URL);
    await this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.deps.notificationRepository.enqueueEmail(tx, {
        recipientUserId: user.id,
        toEmail: user.email,
        templateKey: AUTH_EMAIL_TEMPLATES.welcome,
        templateVersion: "v1",
        idempotencyKey: `admin.customer.password_reset:${user.id}:${randomUUID()}`,
        metadata: {
          adminCreated: true,
          adminReset: true,
          temporaryPassword,
          mustChangePassword: true,
          loginUrl: `${appUrl}${AUTH_ROUTES.login}`,
          name: user.email.split("@")[0] ?? "Investor",
        },
      });
      await this.appendAdminAudit(
        tx,
        admin.appUser.id,
        "customer.password_reset",
        userId,
        context,
        {
          resetByAdmin: true,
        },
      );
    });

    return { temporaryPassword };
  }

  async forcePasswordChange(userId: string, context: RequestAuditContext): Promise<{ ok: true }> {
    const admin = await requireAdminActor(this.deps, "customers.update");
    if (!this.deps.identityProvider?.adminSetMustChangePassword) {
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: "Force password change is unavailable.",
      });
    }

    const user = await this.deps.identityRepository.findUserById(userId);
    if (!user) {
      throw new AppError({ code: "NOT_FOUND", message: "Customer was not found." });
    }

    await this.deps.identityProvider.adminSetMustChangePassword(user.authUserId, true);
    await this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.appendAdminAudit(
        tx,
        admin.appUser.id,
        "customer.force_password_change",
        userId,
        context,
        { mustChangePassword: true },
      );
    });

    return { ok: true };
  }

  async creditWallet(
    userId: string,
    input: AdminWalletAdjustmentInput,
    context: RequestAuditContext,
  ) {
    return this.adjustWallet(userId, "credit", input, context);
  }

  async debitWallet(
    userId: string,
    input: AdminWalletAdjustmentInput,
    context: RequestAuditContext,
  ) {
    return this.adjustWallet(userId, "debit", input, context);
  }

  async deleteCustomer(
    userId: string,
    confirmation: string,
    context: RequestAuditContext,
  ): Promise<{ deleted: true }> {
    const admin = await requireAdminActor(this.deps, "customers.suspend");

    if (confirmation.trim().toUpperCase() !== "DELETE") {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Type DELETE to confirm customer deletion.",
      });
    }

    if (userId === admin.appUser.id) {
      throw new AppError({
        code: "AUTHORIZATION_ERROR",
        message: "You cannot delete the currently logged-in administrator.",
      });
    }

    const user = await this.deps.identityRepository.findUserById(userId);
    if (!user) {
      throw new AppError({ code: "NOT_FOUND", message: "Customer was not found." });
    }

    const adminProfile = await this.deps.identityRepository.findAdminProfileByUserId(userId);
    if (adminProfile) {
      throw new AppError({
        code: "AUTHORIZATION_ERROR",
        message: "Staff accounts cannot be deleted from customer management.",
      });
    }

    await this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.deps.identityRepository.updateUserStatus(tx, userId, "closed");
      await this.deps.coreRepository.updateCustomerAccountStatus(tx, userId, {
        status: "closed",
        restrictionReason: "Deleted by administrator",
        closedAt: new Date(),
      });
      await this.appendAdminAudit(
        tx,
        admin.appUser.id,
        "customer.deleted",
        userId,
        context,
        { email: user.email },
        "Deleted by administrator",
      );
    });

    await this.deps.identityProvider?.adminDeleteUser?.(user.authUserId).catch(() => undefined);

    return { deleted: true };
  }

  /**
   * Applies suspend / reactivate / lock / unlock / delete to many customers in one request.
   * Each user is updated immediately; failures are collected per id without aborting the batch.
   */
  async bulkCustomerAction(
    input: BulkCustomerActionInput,
    context: RequestAuditContext,
  ): Promise<{
    action: BulkCustomerActionInput["action"];
    succeeded: string[];
    failed: Array<{ userId: string; message: string }>;
  }> {
    await requireAdminActor(this.deps, "customers.suspend");

    const uniqueIds = [...new Set(input.userIds)];
    const succeeded: string[] = [];
    const failed: Array<{ userId: string; message: string }> = [];

    const defaultReason =
      input.reason?.trim() ||
      (input.action === "lock"
        ? "Administrative lock"
        : input.action === "suspend"
          ? "Administrative suspension"
          : input.action === "reactivate" || input.action === "unlock"
            ? "Administrative reactivation"
            : "Deleted by administrator");

    for (const userId of uniqueIds) {
      try {
        switch (input.action) {
          case "suspend":
            await this.updateCustomerStatus(
              userId,
              { status: "restricted", reason: defaultReason },
              context,
            );
            break;
          case "reactivate":
          case "unlock":
            await this.updateCustomerStatus(
              userId,
              { status: "active", reason: defaultReason },
              context,
            );
            break;
          case "lock":
            await this.lockCustomer(userId, defaultReason, context);
            break;
          case "delete":
            await this.deleteCustomer(userId, input.confirmation ?? "DELETE", context);
            break;
          default:
            break;
        }
        succeeded.push(userId);
      } catch (error) {
        failed.push({
          userId,
          message: error instanceof AppError ? error.message : "Action failed.",
        });
      }
    }

    return { action: input.action, succeeded, failed };
  }

  async updateCustomerVerification(
    userId: string,
    input: UpdateCustomerKycInput,
    context: RequestAuditContext,
  ): Promise<CustomerDetails> {
    const admin = await requireAdminActor(this.deps, "customers.kyc");

    const user = await this.deps.identityRepository.findUserById(userId);
    if (!user) {
      throw new AppError({ code: "NOT_FOUND", message: "Customer was not found." });
    }

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const profile = await this.deps.coreRepository.updateCustomerKycStatus(tx, userId, {
        kycStatus: input.kycStatus,
        ...(input.riskStatus ? { riskStatus: input.riskStatus } : {}),
      });

      await this.appendAdminAudit(
        tx,
        admin.appUser.id,
        "customer.kyc_updated",
        userId,
        context,
        { kycStatus: input.kycStatus, riskStatus: input.riskStatus ?? null, reason: input.reason },
        input.reason,
      );

      const account = await this.deps.coreRepository.findCustomerAccountByUserId(userId);
      return { user, profile, account };
    });
  }

  async addCustomerNote(
    userId: string,
    input: AddCustomerNoteInput,
    context: RequestAuditContext,
  ): Promise<CustomerNoteRecord> {
    const admin = await requireAdminActor(this.deps, "customers.notes");

    const user = await this.deps.identityRepository.findUserById(userId);
    if (!user) {
      throw new AppError({ code: "NOT_FOUND", message: "Customer was not found." });
    }

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const note = await this.deps.coreRepository.createCustomerNote(tx, {
        userId,
        authorUserId: admin.appUser.id,
        body: input.body.trim(),
      });

      await this.appendAdminAudit(tx, admin.appUser.id, "customer.note_added", userId, context, {
        noteId: note.id,
      });

      return note;
    });
  }

  async listCustomerNotes(userId: string, limit = 50): Promise<CustomerNoteRecord[]> {
    await requireAdminActor(this.deps, "customers.read");
    return this.deps.coreRepository.listCustomerNotesByUserId(userId, limit);
  }

  async getCustomerAuditTimeline(userId: string, limit = 50): Promise<AuditLogRecord[]> {
    await requireAdminActor(this.deps, "customers.read");
    return this.deps.operationsRepository.listAuditLogsForCustomerTimeline(userId, limit);
  }

  private async adjustWallet(
    userId: string,
    direction: "credit" | "debit",
    input: AdminWalletAdjustmentInput,
    context: RequestAuditContext,
  ) {
    const admin = await requireAdminActor(this.deps, "customers.update");
    const reason = input.reason.trim();
    if (!reason) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "A reason is required for wallet adjustments.",
      });
    }

    const amountMinor = BigInt(input.amountMinor);
    if (amountMinor <= 0n) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Amount must be a positive integer in minor units.",
      });
    }

    const currency = (input.currency ?? "USD").toUpperCase();
    const user = await this.deps.identityRepository.findUserById(userId);
    if (!user) {
      throw new AppError({ code: "NOT_FOUND", message: "Customer was not found." });
    }

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.deps.ledgerRepository.lockWalletByUserCurrency(tx, userId, currency);
      const balance = await this.deps.ledgerRepository.findWalletBalanceByUserCurrencyInTransaction(
        tx,
        userId,
        currency,
      );
      if (!balance) {
        throw new AppError({ code: "INVALID_STATE", message: "Customer wallet was not found." });
      }

      const availableAccount =
        await this.deps.ledgerRepository.findWalletAccountByCategoryInTransaction(tx, {
          walletId: balance.walletId,
          category: "available",
        });
      if (!availableAccount) {
        throw new AppError({
          code: "INVALID_STATE",
          message: "Customer available wallet account was not found.",
        });
      }

      if (direction === "debit") {
        const available = BigInt(String(balance.availableBalanceMinor));
        if (available < amountMinor) {
          throw new AppError({
            code: "VALIDATION_ERROR",
            message: "Insufficient available balance for debit.",
          });
        }
      }

      const platformCash = await this.deps.ledgerRepository.ensureLedgerAccount(tx, {
        ownerType: "platform",
        ownerId: "unique_sky_way",
        accountType: "platform_cash",
        currency,
        status: "active",
      });

      const entries =
        direction === "credit"
          ? [
              {
                accountId: platformCash.id,
                direction: "debit" as const,
                amountMinor,
                currency,
              },
              {
                accountId: availableAccount.id,
                direction: "credit" as const,
                amountMinor,
                currency,
              },
            ]
          : [
              {
                accountId: availableAccount.id,
                direction: "debit" as const,
                amountMinor,
                currency,
              },
              {
                accountId: platformCash.id,
                direction: "credit" as const,
                amountMinor,
                currency,
              },
            ];

      assertBalancedLedgerPosting({ entries });

      const idempotencyKey = `admin.wallet.${direction}:${userId}:${randomUUID()}`;
      const ledger = await this.deps.ledgerRepository.postLedgerTransaction(tx, {
        transaction: {
          transactionType: "ledger_correction",
          idempotencyKey,
          referenceType: "admin_wallet_adjustment",
          referenceId: userId,
          description: `Admin wallet ${direction}: ${reason}`,
          createdBy: admin.appUser.id,
          metadata: {
            source: "admin",
            direction,
            amountMinor: amountMinor.toString(),
            currency,
            reason,
            adminUserId: admin.appUser.id,
            invariantIds: ["FI-101", "FI-102"],
          },
        },
        entries,
      });

      await this.appendAdminAudit(
        tx,
        admin.appUser.id,
        direction === "credit" ? "customer.wallet_credited" : "customer.wallet_debited",
        userId,
        context,
        {
          amountMinor: amountMinor.toString(),
          currency,
          reason,
          ledgerTransactionId: ledger.transaction.id,
        },
        reason,
      );

      return {
        ledgerTransactionId: ledger.transaction.id,
        direction,
        amountMinor: amountMinor.toString(),
        currency,
      };
    });
  }

  private async loadCustomerDetails(userId: string): Promise<CustomerDetails> {
    const user = await this.deps.identityRepository.findUserById(userId);
    if (!user) {
      throw new AppError({ code: "NOT_FOUND", message: "Customer was not found." });
    }

    const [profile, account] = await Promise.all([
      this.deps.coreRepository.findCustomerProfileByUserId(userId),
      this.deps.coreRepository.findCustomerAccountByUserId(userId),
    ]);

    return { user, profile, account };
  }

  private async loadCustomerDetailsInTx(
    _tx: DrizzleTransactionContext,
    userId: string,
  ): Promise<CustomerDetails> {
    return this.loadCustomerDetails(userId);
  }

  private async appendAdminAudit(
    tx: DrizzleTransactionContext,
    actorUserId: string,
    action: string,
    targetId: string,
    context: RequestAuditContext,
    metadata: Record<string, unknown> = {},
    reason: string | null = null,
  ) {
    await this.deps.operationsRepository.appendAuditLog(tx, {
      actorUserId,
      actorType: "admin",
      action,
      targetType: "user",
      targetId,
      reason,
      metadata,
      requestId: context.requestId,
      ipAddressHash: context.ipAddressHash,
      userAgentHash: context.userAgentHash,
    });
  }
}

export function createAdminAuditContext(context: RequestSecurityContext): RequestAuditContext {
  return {
    requestId: context.requestId,
    ipAddressHash: hashIpAddress(context.ipAddress),
    userAgentHash: hashUserAgent(context.userAgent),
  };
}

function generateTemporaryPassword(): string {
  const raw = randomBytes(12).toString("base64url");
  return `UsW1!${raw.slice(0, 12)}`;
}

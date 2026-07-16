import "server-only";

import { randomUUID } from "node:crypto";

import type { IdentityProvider } from "@/application/auth";
import {
  hashIpAddress,
  hashUserAgent,
  type RequestSecurityContext,
} from "@/application/auth/security";
import { AppError } from "@/application/errors";
import type { Clock } from "@/application/ports";
import {
  assertBalancedLedgerPosting,
  createDepositConfirmationEntries,
  createDepositReversalEntries,
} from "@/domains/ledger";
import { assertDepositTransition } from "@/domains/payments/deposit-state-machine";
import type {
  CoreRepository,
  DepositIntentRecord,
  DrizzleTransactionContext,
  DrizzleTransactionManager,
  IdentityRepository,
  LedgerRepository,
  NotificationRepository,
  OperationsRepository,
  PaymentRepository,
} from "@/infrastructure/database";

import { MANUAL_DEPOSIT_PROVIDER } from "./funding-constants";
import type { CreateDepositIntentInput } from "./schemas";

const DEPOSIT_REFERENCE_PREFIX = "USWDEP";
const FINANCE_ADMIN_ROLES = new Set([
  "finance_admin",
  "finance_manager",
  "finance_officer",
  "platform_admin",
  "super_admin",
]);
const DEPOSIT_EMAIL_TEMPLATES = {
  initiated: "deposit.initiated",
  confirmed: "deposit.confirmed",
  failed: "deposit.failed",
  cancelled: "deposit.cancelled",
  reversed: "deposit.reversed",
} as const;

export interface DepositEngineServiceDependencies {
  identityProvider?: IdentityProvider;
  clock: Clock;
  transactionManager: DrizzleTransactionManager;
  identityRepository: IdentityRepository;
  coreRepository: CoreRepository;
  paymentRepository: PaymentRepository;
  ledgerRepository: LedgerRepository;
  notificationRepository: NotificationRepository;
  operationsRepository: OperationsRepository;
}

export interface CreateDepositIntentCommand extends CreateDepositIntentInput {
  idempotencyKey: string;
}

export interface RequestAuditContext {
  requestId: string;
  ipAddressHash: string | null;
  userAgentHash: string | null;
}

export interface CreateDepositIntentResult {
  depositIntent: DepositIntentRecord;
  providerAction: null;
  idempotent: boolean;
}

export interface AdminDepositActionResult {
  depositIntent: DepositIntentRecord;
  idempotent: boolean;
}

export interface ReverseDepositIntentOptions {
  providerEventId?: string;
  reason?: string;
}

export class DepositEngineService {
  constructor(private readonly deps: DepositEngineServiceDependencies) {}

  async listDepositIntents() {
    const appUser = await this.requireCurrentVerifiedAppUser();
    return this.deps.paymentRepository.listDepositIntentsByUserId(appUser.id);
  }

  async listAllDepositIntents(
    status?: DepositIntentRecord["status"],
  ): Promise<DepositIntentRecord[]> {
    await this.requireFinanceAdmin();
    return this.deps.paymentRepository.listDepositIntents(status);
  }

  async createDepositIntent(
    input: CreateDepositIntentCommand,
    context: RequestAuditContext,
  ): Promise<CreateDepositIntentResult> {
    if (!input.idempotencyKey.trim()) {
      throw new AppError({
        code: "IDEMPOTENCY_ERROR",
        message: "An idempotency key is required for deposit creation.",
      });
    }

    if (!input.asset || !input.fundingWalletId || !input.transactionHash?.trim()) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Asset, funding wallet, and transaction hash are required for manual deposits.",
      });
    }

    const appUser = await this.requireCurrentVerifiedAppUser();
    await this.requireActiveCustomerAccount(appUser.id);

    const existing = await this.deps.paymentRepository.findDepositIntentByIdempotencyKey(
      input.idempotencyKey,
    );
    if (existing) {
      this.assertIdempotencyOwnership(existing, appUser.id);
      return this.toCreateDepositIntentResult(existing, true);
    }

    const fundingWallet = await this.deps.paymentRepository.findFundingWalletById(
      input.fundingWalletId,
    );
    if (!fundingWallet || fundingWallet.status !== "active") {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Selected funding wallet is unavailable.",
      });
    }
    if (fundingWallet.asset !== input.asset) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Funding wallet asset does not match the selected asset.",
      });
    }

    const reference = createDepositReference(appUser.id);
    const providerMetadata = {
      asset: input.asset,
      network: fundingWallet.network,
      fundingWalletId: input.fundingWalletId,
      transactionHash: input.transactionHash,
      customerNote: input.customerNote ?? null,
      address: fundingWallet.address,
      ...(input.evidenceUrl ? { evidenceUrl: input.evidenceUrl } : {}),
    };

    const pending = await this.deps.transactionManager.runInTransaction(async (tx) => {
      const deposit = await this.deps.paymentRepository.createDepositIntent(tx, {
        userId: appUser.id,
        provider: MANUAL_DEPOSIT_PROVIDER,
        providerIntentId: reference,
        currency: "USD",
        amountMinor: input.amountMinor,
        status: "pending",
        idempotencyKey: input.idempotencyKey,
        fundingAsset: input.asset,
        fundingNetwork: fundingWallet.network,
        transactionHash: input.transactionHash,
        customerNote: input.customerNote ?? null,
        fundingWalletId: input.fundingWalletId,
        providerMetadata,
      });

      await this.appendCustomerAudit(tx, appUser.id, "deposit.created", deposit.id, context, {
        provider: MANUAL_DEPOSIT_PROVIDER,
        amountMinor: input.amountMinor.toString(),
        currency: "USD",
        asset: input.asset,
        fundingWalletId: input.fundingWalletId,
        transactionHash: input.transactionHash,
      });

      await this.enqueueDepositInitiatedSideEffects(tx, deposit, appUser.email, context);
      return deposit;
    });

    return this.toCreateDepositIntentResult(pending, false);
  }

  async cancelDepositIntent(
    depositId: string,
    context: RequestAuditContext,
  ): Promise<AdminDepositActionResult> {
    const appUser = await this.requireCurrentVerifiedAppUser();

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const current = await this.deps.paymentRepository.lockDepositIntentById(tx, depositId);
      if (!current) {
        throw new AppError({ code: "NOT_FOUND", message: "Deposit intent was not found." });
      }
      if (current.userId !== appUser.id) {
        throw new AppError({
          code: "AUTHORIZATION_ERROR",
          message: "You are not authorized to cancel this deposit.",
        });
      }
      if (current.status === "cancelled") {
        return { depositIntent: current, idempotent: true };
      }
      if (current.status !== "created" && current.status !== "pending") {
        throw new AppError({
          code: "INVALID_STATE",
          message: "Only created or pending deposits can be cancelled.",
        });
      }

      assertDepositTransition(current.status, "cancelled");
      const cancelled = await this.deps.paymentRepository.markDepositIntentCancelled(
        tx,
        current.id,
        "Cancelled by customer.",
      );
      await this.appendCustomerAudit(tx, appUser.id, "deposit.cancelled", cancelled.id, context);
      await this.enqueueDepositCancelledSideEffects(tx, cancelled, context);
      return { depositIntent: cancelled, idempotent: false };
    });
  }

  async reverseDepositIntent(
    depositId: string,
    context: RequestAuditContext,
    options: ReverseDepositIntentOptions = {},
  ): Promise<AdminDepositActionResult> {
    const admin = await this.requireFinanceAdmin();

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const current = await this.deps.paymentRepository.lockDepositIntentById(tx, depositId);
      if (!current) {
        throw new AppError({ code: "NOT_FOUND", message: "Deposit intent was not found." });
      }
      if (current.status === "reversed" && current.reversalLedgerTransactionId) {
        return { depositIntent: current, idempotent: true };
      }
      if (current.status !== "confirmed") {
        throw new AppError({
          code: "INVALID_STATE",
          message: "Only confirmed deposits without an existing reversal can be reversed.",
        });
      }

      assertDepositTransition(current.status, "reversed");

      await this.deps.ledgerRepository.lockWalletByUserCurrency(
        tx,
        current.userId,
        current.currency,
      );
      const balance = await this.deps.ledgerRepository.findWalletBalanceByUserCurrencyInTransaction(
        tx,
        current.userId,
        current.currency,
      );
      if (!balance) {
        throw new AppError({ code: "INVALID_STATE", message: "Customer wallet was not found." });
      }
      if (balance.availableBalanceMinor < current.amountMinor) {
        throw new AppError({
          code: "FINANCIAL_INTEGRITY_ERROR",
          message:
            "Available balance is insufficient to reverse this deposit without creating a negative balance. This reversal requires manual financial exception handling.",
          details: {
            depositId: current.id,
            availableBalanceMinor: balance.availableBalanceMinor.toString(),
            amountMinor: current.amountMinor.toString(),
          },
        });
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

      const providerClearingAccount = await this.deps.ledgerRepository.ensureLedgerAccount(tx, {
        ownerType: "provider",
        ownerId: current.provider,
        accountType: "provider_cash_clearing",
        currency: current.currency,
        status: "active",
      });

      const entries = createDepositReversalEntries({
        customerAvailableAccountId: availableAccount.id,
        providerClearingAccountId: providerClearingAccount.id,
        amountMinor: current.amountMinor,
        currency: current.currency,
      });
      assertBalancedLedgerPosting({ entries });

      const providerEventIdOrDepositId = options.providerEventId ?? current.id;
      const idempotencyKey = `deposit_reversal:${current.provider}:${providerEventIdOrDepositId}`;
      const ledger = await this.deps.ledgerRepository.postLedgerTransaction(tx, {
        transaction: {
          transactionType: "deposit_reversal",
          idempotencyKey,
          referenceType: "deposit_intent",
          referenceId: current.id,
          description: "Customer deposit reversal",
          metadata: {
            source: "admin",
            idempotencyKey,
            adminUserId: admin.id,
            reason: options.reason ?? null,
            providerEventId: options.providerEventId ?? null,
            invariantIds: ["FI-101", "FI-102", "FI-105", "FI-501"],
          },
        },
        entries,
      });

      const reversed = await this.deps.paymentRepository.markDepositIntentReversed(tx, current.id, {
        reversalLedgerTransactionId: ledger.transaction.id,
      });
      await this.appendAdminAudit(tx, admin.id, "deposit.reversed", reversed.id, context, {
        reason: options.reason ?? null,
        reversalLedgerTransactionId: ledger.transaction.id,
      });
      await this.enqueueDepositReversedSideEffects(tx, reversed, context);
      return { depositIntent: reversed, idempotent: false };
    });
  }

  async adminApproveDeposit(
    depositId: string,
    reason: string,
    context: RequestAuditContext,
  ): Promise<AdminDepositActionResult> {
    if (!reason.trim()) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "An approval reason is required.",
      });
    }
    const admin = await this.requireFinanceAdmin();

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const current = await this.deps.paymentRepository.lockDepositIntentById(tx, depositId);
      if (!current) {
        throw new AppError({ code: "NOT_FOUND", message: "Deposit intent was not found." });
      }
      if (current.status === "confirmed" && current.confirmationLedgerTransactionId) {
        return { depositIntent: current, idempotent: true };
      }
      if (current.status !== "pending") {
        throw new AppError({
          code: "INVALID_STATE",
          message: "Only pending deposits can be manually approved.",
        });
      }

      assertDepositTransition(current.status, "confirmed");

      await this.deps.ledgerRepository.lockWalletByUserCurrency(
        tx,
        current.userId,
        current.currency,
      );
      const balance = await this.deps.ledgerRepository.findWalletBalanceByUserCurrencyInTransaction(
        tx,
        current.userId,
        current.currency,
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

      const providerClearingAccount = await this.deps.ledgerRepository.ensureLedgerAccount(tx, {
        ownerType: "provider",
        ownerId: current.provider,
        accountType: "provider_cash_clearing",
        currency: current.currency,
        status: "active",
      });

      const amountMinor = BigInt(current.amountMinor);
      const entries = createDepositConfirmationEntries({
        providerClearingAccountId: providerClearingAccount.id,
        customerAvailableAccountId: availableAccount.id,
        amountMinor,
        currency: current.currency,
      });
      assertBalancedLedgerPosting({ entries });

      const idempotencyKey = `deposit_confirmation:${current.provider}:manual:${current.id}`;
      const ledger = await this.deps.ledgerRepository.postLedgerTransaction(tx, {
        transaction: {
          transactionType: "deposit_confirmation",
          idempotencyKey,
          referenceType: "deposit_intent",
          referenceId: current.id,
          description: "Manual admin deposit confirmation",
          metadata: {
            source: "admin",
            idempotencyKey,
            adminUserId: admin.id,
            reason,
            amountMinor: amountMinor.toString(),
            invariantIds: ["FI-101", "FI-102", "FI-105", "FI-501"],
          },
        },
        entries,
      });

      const confirmed = await this.deps.paymentRepository.markDepositIntentConfirmed(
        tx,
        current.id,
        {
          confirmationLedgerTransactionId: ledger.transaction.id,
          providerMetadata: {
            ...current.providerMetadata,
            manualApproval: { adminUserId: admin.id, reason },
          },
        },
      );
      await this.appendAdminAudit(tx, admin.id, "deposit.approved", confirmed.id, context, {
        reason,
      });
      await this.enqueueDepositConfirmedSideEffects(tx, confirmed, context);

      return { depositIntent: confirmed, idempotent: false };
    });
  }

  async adminRejectDeposit(
    depositId: string,
    reason: string,
    context: RequestAuditContext,
  ): Promise<AdminDepositActionResult> {
    if (!reason.trim()) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "A rejection reason is required.",
      });
    }
    const admin = await this.requireFinanceAdmin();

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const current = await this.deps.paymentRepository.lockDepositIntentById(tx, depositId);
      if (!current) {
        throw new AppError({ code: "NOT_FOUND", message: "Deposit intent was not found." });
      }
      if (current.status === "cancelled") {
        return { depositIntent: current, idempotent: true };
      }
      if (current.status !== "pending") {
        throw new AppError({
          code: "INVALID_STATE",
          message: "Only pending deposits can be rejected.",
        });
      }

      assertDepositTransition(current.status, "cancelled");
      const cancelled = await this.deps.paymentRepository.markDepositIntentCancelled(
        tx,
        current.id,
        reason,
      );
      await this.appendAdminAudit(tx, admin.id, "deposit.rejected", cancelled.id, context, {
        reason,
      });
      await this.enqueueDepositCancelledSideEffects(tx, cancelled, context);
      return { depositIntent: cancelled, idempotent: false };
    });
  }

  private async requireFinanceAdmin() {
    if (!this.deps.identityProvider) {
      throw new AppError({ code: "AUTHENTICATION_ERROR", message: "Authentication is required." });
    }

    const currentUser = await this.deps.identityProvider.getCurrentUser();
    if (!currentUser) {
      throw new AppError({ code: "AUTHENTICATION_ERROR", message: "Authentication is required." });
    }

    const appUser = await this.deps.identityRepository.findUserByAuthUserId(currentUser.authUserId);
    if (!appUser || appUser.status !== "active") {
      throw new AppError({
        code: "AUTHENTICATION_ERROR",
        message: "An active admin account is required.",
      });
    }

    const adminProfile = await this.deps.identityRepository.findAdminProfileByUserId(appUser.id);
    if (!adminProfile || adminProfile.status !== "active") {
      throw new AppError({
        code: "AUTHORIZATION_ERROR",
        message: "An active admin profile is required.",
      });
    }

    const roleKeys = await this.deps.identityRepository.listActiveRoleKeysForUser(appUser.id);
    if (!roleKeys.some((roleKey) => FINANCE_ADMIN_ROLES.has(roleKey))) {
      throw new AppError({
        code: "AUTHORIZATION_ERROR",
        message: "Finance admin authorization is required.",
      });
    }

    return appUser;
  }

  private async requireCurrentVerifiedAppUser() {
    if (!this.deps.identityProvider) {
      throw new AppError({ code: "AUTHENTICATION_ERROR", message: "Authentication is required." });
    }

    const currentUser = await this.deps.identityProvider.getCurrentUser();
    if (!currentUser) {
      throw new AppError({ code: "AUTHENTICATION_ERROR", message: "Authentication is required." });
    }
    if (!currentUser.emailVerifiedAt) {
      throw new AppError({
        code: "AUTHENTICATION_ERROR",
        message: "Email verification is required before creating deposits.",
      });
    }

    const appUser = await this.deps.identityRepository.findUserByAuthUserId(currentUser.authUserId);
    if (!appUser || appUser.status !== "active" || !appUser.emailVerifiedAt) {
      throw new AppError({
        code: "AUTHENTICATION_ERROR",
        message: "A verified active customer account is required.",
      });
    }

    return appUser;
  }

  private async requireActiveCustomerAccount(userId: string) {
    const account = await this.deps.coreRepository.findCustomerAccountByUserId(userId);
    if (!account || account.status !== "active") {
      throw new AppError({
        code: "AUTHORIZATION_ERROR",
        message: "An active customer account is required before creating deposits.",
      });
    }
    return account;
  }

  private assertIdempotencyOwnership(deposit: DepositIntentRecord, userId: string) {
    if (deposit.userId !== userId) {
      throw new AppError({
        code: "IDEMPOTENCY_ERROR",
        message: "Idempotency key belongs to a different customer.",
      });
    }
  }

  private toCreateDepositIntentResult(
    depositIntent: DepositIntentRecord,
    idempotent: boolean,
  ): CreateDepositIntentResult {
    return {
      depositIntent,
      idempotent,
      providerAction: null,
    };
  }

  private async enqueueDepositInitiatedSideEffects(
    tx: DrizzleTransactionContext,
    deposit: DepositIntentRecord,
    email: string,
    context: RequestAuditContext,
  ) {
    await this.deps.notificationRepository.enqueueOutboxEvent(tx, {
      eventType: "deposit.initiated",
      aggregateType: "deposit_intent",
      aggregateId: deposit.id,
      payload: depositEventPayload(deposit),
    });
    await this.deps.notificationRepository.createNotification(tx, {
      userId: deposit.userId,
      type: "deposit.initiated",
      title: "Deposit submitted",
      body: "Your deposit is awaiting manual review.",
      priority: "info",
      data: depositEventPayload(deposit),
    });
    await this.deps.notificationRepository.enqueueEmail(tx, {
      recipientUserId: deposit.userId,
      toEmail: email,
      templateKey: DEPOSIT_EMAIL_TEMPLATES.initiated,
      templateVersion: "v1",
      idempotencyKey: `deposit.initiated:${deposit.id}`,
      metadata: depositEventPayload(deposit),
    });
    await this.appendCustomerAudit(tx, deposit.userId, "deposit.initiated", deposit.id, context);
  }

  private async enqueueDepositConfirmedSideEffects(
    tx: DrizzleTransactionContext,
    deposit: DepositIntentRecord,
    context: RequestAuditContext,
  ) {
    const user = await this.deps.identityRepository.findUserById(deposit.userId);
    await this.deps.notificationRepository.enqueueOutboxEvent(tx, {
      eventType: "deposit.confirmed",
      aggregateType: "deposit_intent",
      aggregateId: deposit.id,
      payload: depositEventPayload(deposit),
    });
    await this.deps.notificationRepository.createNotification(tx, {
      userId: deposit.userId,
      type: "deposit.confirmed",
      title: "Deposit confirmed",
      body: "Your deposit has been credited to your available balance.",
      priority: "success",
      data: depositEventPayload(deposit),
    });
    if (user) {
      await this.deps.notificationRepository.enqueueEmail(tx, {
        recipientUserId: deposit.userId,
        toEmail: user.email,
        templateKey: DEPOSIT_EMAIL_TEMPLATES.confirmed,
        templateVersion: "v1",
        idempotencyKey: `deposit.confirmed:${deposit.id}`,
        metadata: depositEventPayload(deposit),
      });
    }
    await this.appendCustomerAudit(tx, deposit.userId, "deposit.confirmed", deposit.id, context, {
      ledgerTransactionId: deposit.confirmationLedgerTransactionId,
    });
  }

  private async enqueueDepositCancelledSideEffects(
    tx: DrizzleTransactionContext,
    deposit: DepositIntentRecord,
    context: RequestAuditContext,
  ) {
    const user = await this.deps.identityRepository.findUserById(deposit.userId);
    await this.deps.notificationRepository.enqueueOutboxEvent(tx, {
      eventType: "deposit.cancelled",
      aggregateType: "deposit_intent",
      aggregateId: deposit.id,
      payload: depositEventPayload(deposit),
    });
    await this.deps.notificationRepository.createNotification(tx, {
      userId: deposit.userId,
      type: "deposit.cancelled",
      title: "Deposit cancelled",
      body: "Your deposit was cancelled.",
      priority: "info",
      data: depositEventPayload(deposit),
    });
    if (user) {
      await this.deps.notificationRepository.enqueueEmail(tx, {
        recipientUserId: deposit.userId,
        toEmail: user.email,
        templateKey: DEPOSIT_EMAIL_TEMPLATES.cancelled,
        templateVersion: "v1",
        idempotencyKey: `deposit.cancelled:${deposit.id}`,
        metadata: depositEventPayload(deposit),
      });
    }
    void context;
  }

  private async enqueueDepositReversedSideEffects(
    tx: DrizzleTransactionContext,
    deposit: DepositIntentRecord,
    context: RequestAuditContext,
  ) {
    const user = await this.deps.identityRepository.findUserById(deposit.userId);
    await this.deps.notificationRepository.enqueueOutboxEvent(tx, {
      eventType: "deposit.reversed",
      aggregateType: "deposit_intent",
      aggregateId: deposit.id,
      payload: depositEventPayload(deposit),
    });
    await this.deps.notificationRepository.enqueueOutboxEvent(tx, {
      eventType: "admin.deposit_reversed",
      aggregateType: "deposit_intent",
      aggregateId: deposit.id,
      payload: depositEventPayload(deposit),
    });
    await this.deps.notificationRepository.createNotification(tx, {
      userId: deposit.userId,
      type: "deposit.reversed",
      title: "Deposit reversed",
      body: "Your deposit has been reversed and removed from your available balance.",
      priority: "warning",
      data: depositEventPayload(deposit),
    });
    if (user) {
      await this.deps.notificationRepository.enqueueEmail(tx, {
        recipientUserId: deposit.userId,
        toEmail: user.email,
        templateKey: DEPOSIT_EMAIL_TEMPLATES.reversed,
        templateVersion: "v1",
        idempotencyKey: `deposit.reversed:${deposit.id}`,
        metadata: depositEventPayload(deposit),
      });
    }
    void context;
  }

  private async appendCustomerAudit(
    tx: DrizzleTransactionContext,
    actorUserId: string,
    action: string,
    targetId: string,
    context: RequestAuditContext,
    metadata: Record<string, unknown> = {},
  ) {
    await this.deps.operationsRepository.appendAuditLog(tx, {
      actorUserId,
      actorType: "customer",
      action,
      targetType: "deposit_intent",
      targetId,
      metadata,
      requestId: context.requestId,
      ipAddressHash: context.ipAddressHash,
      userAgentHash: context.userAgentHash,
    });
  }

  private async appendAdminAudit(
    tx: DrizzleTransactionContext,
    actorUserId: string | null,
    action: string,
    targetId: string,
    context: RequestAuditContext,
    metadata: Record<string, unknown> = {},
  ) {
    await this.deps.operationsRepository.appendAuditLog(tx, {
      actorUserId,
      actorType: "admin",
      action,
      targetType: "deposit_intent",
      targetId,
      metadata,
      requestId: context.requestId,
      ipAddressHash: context.ipAddressHash,
      userAgentHash: context.userAgentHash,
    });
  }
}

export function createPaymentAuditContext(context: RequestSecurityContext): RequestAuditContext {
  return {
    requestId: context.requestId,
    ipAddressHash: hashIpAddress(context.ipAddress),
    userAgentHash: hashUserAgent(context.userAgent),
  };
}

function createDepositReference(userId: string) {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 24).toUpperCase();
  return `${DEPOSIT_REFERENCE_PREFIX}-${userId.slice(0, 8)}-${suffix}`;
}

function depositEventPayload(deposit: DepositIntentRecord) {
  return {
    depositIntentId: deposit.id,
    provider: deposit.provider,
    providerIntentId: deposit.providerIntentId,
    amountMinor: deposit.amountMinor.toString(),
    currency: deposit.currency,
    status: deposit.status,
    fundingAsset: deposit.fundingAsset,
    transactionHash: deposit.transactionHash,
  };
}

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
  PaymentProviderEventRecord,
  PaymentRepository,
} from "@/infrastructure/database";
import { isProviderEventProcessingLeaseActive } from "@/infrastructure/database";

import type {
  PaymentProvider,
  PaymentProviderName,
  VerifiedDepositResult,
} from "./payment-provider";
import type { CreateDepositIntentInput } from "./schemas";
import {
  MAX_PROVIDER_EVENT_ATTEMPTS,
  computeRetryBackoffMs,
  createProviderEventId,
  hashWebhookPayload,
  parsePaystackWebhook,
  requireProviderReference,
  type PaystackWebhookEvent,
} from "./webhook-processing";

const DEPOSIT_PROVIDER: PaymentProviderName = "paystack";
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
  paymentProvider: PaymentProvider;
}

export interface CreateDepositIntentCommand extends CreateDepositIntentInput {
  idempotencyKey: string;
}

export interface RequestAuditContext {
  requestId: string;
  ipAddressHash: string | null;
  userAgentHash: string | null;
}

export interface DepositProviderAction {
  provider: PaymentProviderName;
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface CreateDepositIntentResult {
  depositIntent: DepositIntentRecord;
  providerAction: DepositProviderAction | null;
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

export interface RecoverProviderEventsResult {
  attempted: number;
  processed: number;
  failed: number;
  deadLettered: number;
}

export interface ProcessPaystackWebhookInput {
  rawBody: string;
  signature: string | null;
  context: RequestAuditContext;
}

export interface ProcessPaystackWebhookResult {
  status: "processed" | "duplicate" | "ignored" | "failed";
  eventType: string;
  providerEventId: string;
  depositIntentId: string | null;
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

    const appUser = await this.requireCurrentVerifiedAppUser();
    await this.requireActiveCustomerAccount(appUser.id);

    const existing = await this.deps.paymentRepository.findDepositIntentByIdempotencyKey(
      input.idempotencyKey,
    );
    if (existing) {
      this.assertIdempotencyOwnership(existing, appUser.id);
      return this.toCreateDepositIntentResult(existing, true);
    }

    const reference = createDepositReference(appUser.id);
    const created = await this.deps.transactionManager.runInTransaction(async (tx) => {
      const deposit = await this.deps.paymentRepository.createDepositIntent(tx, {
        userId: appUser.id,
        provider: input.provider,
        providerIntentId: reference,
        currency: input.currency,
        amountMinor: input.amountMinor,
        status: "created",
        idempotencyKey: input.idempotencyKey,
      });

      await this.appendCustomerAudit(tx, appUser.id, "deposit.created", deposit.id, context, {
        provider: input.provider,
        amountMinor: input.amountMinor.toString(),
        currency: input.currency,
      });

      return deposit;
    });

    if (created.providerIntentId !== reference) {
      this.assertIdempotencyOwnership(created, appUser.id);
      return this.toCreateDepositIntentResult(created, true);
    }

    let initialization;
    try {
      initialization = await this.deps.paymentProvider.initializeDeposit({
        amountMinor: input.amountMinor,
        currency: input.currency,
        customerEmail: appUser.email,
        reference: created.providerIntentId,
        metadata: {
          depositIntentId: created.id,
          userId: appUser.id,
          idempotencyKey: input.idempotencyKey,
        },
      });
    } catch (error) {
      const failed = await this.deps.transactionManager.runInTransaction(async (tx) => {
        const current = await this.deps.paymentRepository.lockDepositIntentById(tx, created.id);
        if (!current || current.status !== "created") return current ?? created;

        assertDepositTransition(current.status, "failed");
        const updated = await this.deps.paymentRepository.markDepositIntentFailed(
          tx,
          current.id,
          "Provider initialization failed.",
        );
        await this.appendCustomerAudit(
          tx,
          appUser.id,
          "deposit.provider_initialization_failed",
          updated.id,
          context,
          { provider: input.provider },
        );
        return updated;
      });

      throw new AppError({
        code: "PROVIDER_ERROR",
        message: "Deposit checkout could not be initialized.",
        details: { depositIntentId: failed.id },
        cause: error,
      });
    }

    const pending = await this.deps.transactionManager.runInTransaction(async (tx) => {
      const current = await this.deps.paymentRepository.lockDepositIntentById(tx, created.id);
      if (!current) {
        throw new AppError({ code: "NOT_FOUND", message: "Deposit intent was not found." });
      }
      if (current.status !== "created") return current;

      assertDepositTransition(current.status, "pending");
      const updated = await this.deps.paymentRepository.updateDepositIntentProviderAction(
        tx,
        current.id,
        {
          status: "pending",
          providerAuthorizationUrl: initialization.authorizationUrl,
          providerAccessCode: initialization.accessCode,
          providerMetadata: initialization.metadata,
        },
      );

      await this.enqueueDepositInitiatedSideEffects(tx, updated, appUser.email, context);
      return updated;
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

      const entries = createDepositConfirmationEntries({
        providerClearingAccountId: providerClearingAccount.id,
        customerAvailableAccountId: availableAccount.id,
        amountMinor: current.amountMinor,
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

  async processPaystackWebhook(
    input: ProcessPaystackWebhookInput,
  ): Promise<ProcessPaystackWebhookResult> {
    if (
      !this.deps.paymentProvider.verifyWebhookSignature({
        rawBody: input.rawBody,
        signature: input.signature,
      })
    ) {
      throw new AppError({
        code: "AUTHORIZATION_ERROR",
        message: "Invalid Paystack webhook signature.",
      });
    }

    const event = parsePaystackWebhook(input.rawBody);
    const providerEventId = createProviderEventId(event);
    const payloadHash = hashWebhookPayload(input.rawBody);
    const storedEvent = await this.deps.transactionManager.runInTransaction(async (tx) => {
      const record = await this.deps.paymentRepository.recordProviderEvent(tx, {
        provider: DEPOSIT_PROVIDER,
        providerEventId,
        eventType: event.event,
        payloadHash,
        payload: event as Record<string, unknown>,
        status: "received",
      });

      if (record.payloadHash !== payloadHash) {
        await this.appendSystemAudit(
          tx,
          "payment.webhook_payload_conflict",
          record.id,
          input.context,
          {
            providerEventId,
            eventType: event.event,
          },
        );
        throw new AppError({
          code: "CONFLICT",
          message: "Webhook event payload hash does not match the existing event.",
        });
      }

      await this.appendSystemAudit(tx, "payment.webhook_received", record.id, input.context, {
        providerEventId,
        eventType: event.event,
      });
      return record;
    });

    if (
      storedEvent.status === "processed" ||
      storedEvent.status === "ignored" ||
      isProviderEventProcessingLeaseActive(storedEvent, this.deps.clock.now())
    ) {
      return {
        status: "duplicate",
        eventType: event.event,
        providerEventId,
        depositIntentId: null,
      };
    }

    if (event.event !== "charge.success" && event.event !== "charge.failed") {
      await this.deps.transactionManager.runInTransaction(async (tx) => {
        await this.deps.paymentRepository.updateProviderEventStatus(tx, storedEvent.id, {
          status: "ignored",
          processedAt: this.deps.clock.now(),
        });
        await this.appendSystemAudit(tx, "payment.webhook_ignored", storedEvent.id, input.context, {
          eventType: event.event,
          providerEventId,
        });
      });

      return {
        status: "ignored",
        eventType: event.event,
        providerEventId,
        depositIntentId: null,
      };
    }

    const claimed = await this.deps.transactionManager.runInTransaction(async (tx) =>
      this.deps.paymentRepository.claimProviderEventForProcessing(tx, storedEvent.id),
    );
    if (!claimed) {
      return {
        status: "duplicate",
        eventType: event.event,
        providerEventId,
        depositIntentId: null,
      };
    }

    try {
      if (event.event === "charge.success") {
        return await this.processSuccessfulCharge(event, claimed, input.context);
      }
      return await this.processFailedCharge(event, claimed, input.context);
    } catch (error) {
      await this.markProviderEventFailedWithBackoff(claimed, error, input.context);
      throw error;
    }
  }

  async recoverProviderEvents(limit = 50): Promise<RecoverProviderEventsResult> {
    const events = await this.deps.paymentRepository.listRetryableProviderEvents(limit);
    const counts: RecoverProviderEventsResult = {
      attempted: 0,
      processed: 0,
      failed: 0,
      deadLettered: 0,
    };

    for (const providerEvent of events) {
      if (providerEvent.provider !== DEPOSIT_PROVIDER) continue;
      if (
        providerEvent.eventType !== "charge.success" &&
        providerEvent.eventType !== "charge.failed"
      ) {
        continue;
      }

      counts.attempted += 1;
      const context = createSystemRecoveryAuditContext();

      const claimed = await this.deps.transactionManager.runInTransaction(async (tx) =>
        this.deps.paymentRepository.claimProviderEventForProcessing(tx, providerEvent.id),
      );
      if (!claimed) continue;

      const payload = claimed.payload as unknown as PaystackWebhookEvent;
      const wasFinalAttempt = claimed.attemptCount >= MAX_PROVIDER_EVENT_ATTEMPTS;

      try {
        if (claimed.eventType === "charge.success") {
          await this.processSuccessfulCharge(payload, claimed, context);
        } else {
          await this.processFailedCharge(payload, claimed, context);
        }
        counts.processed += 1;
      } catch (error) {
        await this.markProviderEventFailedWithBackoff(claimed, error, context);
        if (wasFinalAttempt) {
          counts.deadLettered += 1;
        } else {
          counts.failed += 1;
        }
      }
    }

    return counts;
  }

  private async processSuccessfulCharge(
    event: PaystackWebhookEvent,
    claimedEvent: PaymentProviderEventRecord,
    context: RequestAuditContext,
  ): Promise<ProcessPaystackWebhookResult> {
    const reference = requireProviderReference(event);
    const verified = await this.deps.paymentProvider.verifyDeposit({ reference });

    if (verified.status !== "success") {
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: "Provider verification did not confirm the deposit.",
      });
    }

    const deposit = await this.deps.paymentRepository.findDepositIntentByProviderIntent(
      DEPOSIT_PROVIDER,
      verified.providerReference,
    );

    if (!deposit) {
      await this.ignoreProviderEvent(claimedEvent.id, context, "deposit.webhook_orphaned", {
        reference: verified.providerReference,
      });
      return {
        status: "ignored",
        eventType: event.event,
        providerEventId: claimedEvent.providerEventId,
        depositIntentId: null,
      };
    }

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const current = await this.deps.paymentRepository.lockDepositIntentById(tx, deposit.id);
      if (!current) {
        throw new AppError({ code: "NOT_FOUND", message: "Deposit intent was not found." });
      }

      if (current.status === "confirmed" && current.confirmationLedgerTransactionId) {
        await this.deps.paymentRepository.updateProviderEventStatus(tx, claimedEvent.id, {
          status: "processed",
          processedAt: this.deps.clock.now(),
        });
        return {
          status: "duplicate",
          eventType: event.event,
          providerEventId: claimedEvent.providerEventId,
          depositIntentId: current.id,
        };
      }

      this.assertVerifiedDepositMatchesIntent(verified, current);
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
        ownerId: DEPOSIT_PROVIDER,
        accountType: "provider_cash_clearing",
        currency: current.currency,
        status: "active",
      });

      const entries = createDepositConfirmationEntries({
        providerClearingAccountId: providerClearingAccount.id,
        customerAvailableAccountId: availableAccount.id,
        amountMinor: current.amountMinor,
        currency: current.currency,
      });
      assertBalancedLedgerPosting({ entries });

      const idempotencyKey = `deposit_confirmation:${DEPOSIT_PROVIDER}:${claimedEvent.providerEventId}`;
      const ledger = await this.deps.ledgerRepository.postLedgerTransaction(tx, {
        transaction: {
          transactionType: "deposit_confirmation",
          idempotencyKey,
          referenceType: "deposit_intent",
          referenceId: current.id,
          description: "Customer deposit confirmation",
          metadata: {
            source: "provider_webhook",
            idempotencyKey,
            provider: DEPOSIT_PROVIDER,
            providerEventId: claimedEvent.providerEventId,
            providerReference: verified.providerReference,
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
            verified: verified.metadata,
          },
        },
      );
      await this.deps.paymentRepository.updateProviderEventStatus(tx, claimedEvent.id, {
        status: "processed",
        processedAt: this.deps.clock.now(),
      });
      await this.enqueueDepositConfirmedSideEffects(tx, confirmed, context);

      return {
        status: "processed",
        eventType: event.event,
        providerEventId: claimedEvent.providerEventId,
        depositIntentId: confirmed.id,
      };
    });
  }

  private async processFailedCharge(
    event: PaystackWebhookEvent,
    claimedEvent: PaymentProviderEventRecord,
    context: RequestAuditContext,
  ): Promise<ProcessPaystackWebhookResult> {
    const reference = requireProviderReference(event);
    const deposit = await this.deps.paymentRepository.findDepositIntentByProviderIntent(
      DEPOSIT_PROVIDER,
      reference,
    );

    if (!deposit) {
      await this.ignoreProviderEvent(claimedEvent.id, context, "deposit.failed_webhook_orphaned", {
        reference,
      });
      return {
        status: "ignored",
        eventType: event.event,
        providerEventId: claimedEvent.providerEventId,
        depositIntentId: null,
      };
    }

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const current = await this.deps.paymentRepository.lockDepositIntentById(tx, deposit.id);
      if (!current) {
        throw new AppError({ code: "NOT_FOUND", message: "Deposit intent was not found." });
      }

      if (current.status === "confirmed") {
        await this.deps.paymentRepository.updateProviderEventStatus(tx, claimedEvent.id, {
          status: "ignored",
          processedAt: this.deps.clock.now(),
        });
        return {
          status: "ignored",
          eventType: event.event,
          providerEventId: claimedEvent.providerEventId,
          depositIntentId: current.id,
        };
      }

      assertDepositTransition(current.status, "failed");
      const failed = await this.deps.paymentRepository.markDepositIntentFailed(
        tx,
        current.id,
        "Provider reported failed charge.",
      );
      await this.deps.paymentRepository.updateProviderEventStatus(tx, claimedEvent.id, {
        status: "processed",
        processedAt: this.deps.clock.now(),
      });
      await this.enqueueDepositFailedSideEffects(tx, failed, context);

      return {
        status: "processed",
        eventType: event.event,
        providerEventId: claimedEvent.providerEventId,
        depositIntentId: failed.id,
      };
    });
  }

  private async markProviderEventFailedWithBackoff(
    event: PaymentProviderEventRecord,
    error: unknown,
    context: RequestAuditContext,
  ) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown webhook processing error.";

    if (event.attemptCount >= MAX_PROVIDER_EVENT_ATTEMPTS) {
      await this.deps.transactionManager.runInTransaction(async (tx) => {
        await this.deps.paymentRepository.markProviderEventDeadLettered(tx, event.id, errorMessage);
        await this.appendSystemAudit(tx, "payment.webhook_dead_lettered", event.id, context, {
          providerEventId: event.providerEventId,
          eventType: event.eventType,
          attemptCount: event.attemptCount,
        });
        await this.deps.notificationRepository.enqueueOutboxEvent(tx, {
          eventType: "payment.provider_event.dead_lettered",
          aggregateType: "payment_provider_event",
          aggregateId: event.id,
          payload: {
            provider: event.provider,
            providerEventId: event.providerEventId,
            eventType: event.eventType,
            attemptCount: event.attemptCount,
            errorMessage,
          },
        });
      });
      return;
    }

    const nextRetryAt = new Date(
      this.deps.clock.now().getTime() + computeRetryBackoffMs(event.attemptCount),
    );
    await this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.deps.paymentRepository.updateProviderEventStatus(tx, event.id, {
        status: "failed",
        errorMessage,
        nextRetryAt,
      });
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
      providerAction: depositIntent.providerAuthorizationUrl
        ? {
            provider: DEPOSIT_PROVIDER,
            authorizationUrl: depositIntent.providerAuthorizationUrl,
            accessCode: depositIntent.providerAccessCode ?? "",
            reference: depositIntent.providerIntentId,
          }
        : null,
    };
  }

  private assertVerifiedDepositMatchesIntent(
    verified: VerifiedDepositResult,
    deposit: DepositIntentRecord,
  ) {
    if (verified.providerReference !== deposit.providerIntentId) {
      throw new AppError({
        code: "FINANCIAL_INTEGRITY_ERROR",
        message: "Verified provider reference does not match the deposit intent.",
      });
    }
    if (verified.currency !== deposit.currency || verified.amountMinor !== deposit.amountMinor) {
      throw new AppError({
        code: "FINANCIAL_INTEGRITY_ERROR",
        message: "Verified provider amount does not match the deposit intent.",
        details: {
          expectedAmountMinor: deposit.amountMinor.toString(),
          actualAmountMinor: verified.amountMinor.toString(),
          expectedCurrency: deposit.currency,
          actualCurrency: verified.currency,
        },
      });
    }
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
      title: "Deposit initiated",
      body: "Your deposit is awaiting provider confirmation.",
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

  private async enqueueDepositFailedSideEffects(
    tx: DrizzleTransactionContext,
    deposit: DepositIntentRecord,
    context: RequestAuditContext,
  ) {
    const user = await this.deps.identityRepository.findUserById(deposit.userId);
    await this.deps.notificationRepository.enqueueOutboxEvent(tx, {
      eventType: "deposit.failed",
      aggregateType: "deposit_intent",
      aggregateId: deposit.id,
      payload: depositEventPayload(deposit),
    });
    await this.deps.notificationRepository.createNotification(tx, {
      userId: deposit.userId,
      type: "deposit.failed",
      title: "Deposit failed",
      body: "The provider reported that your deposit was not completed.",
      priority: "warning",
      data: depositEventPayload(deposit),
    });
    if (user) {
      await this.deps.notificationRepository.enqueueEmail(tx, {
        recipientUserId: deposit.userId,
        toEmail: user.email,
        templateKey: DEPOSIT_EMAIL_TEMPLATES.failed,
        templateVersion: "v1",
        idempotencyKey: `deposit.failed:${deposit.id}`,
        metadata: depositEventPayload(deposit),
      });
    }
    await this.appendCustomerAudit(tx, deposit.userId, "deposit.failed", deposit.id, context);
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

  private async ignoreProviderEvent(
    providerEventId: string,
    context: RequestAuditContext,
    action: string,
    metadata: Record<string, unknown>,
  ) {
    await this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.deps.paymentRepository.updateProviderEventStatus(tx, providerEventId, {
        status: "ignored",
        processedAt: this.deps.clock.now(),
      });
      await this.appendSystemAudit(tx, action, providerEventId, context, metadata);
    });
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

  private async appendSystemAudit(
    tx: DrizzleTransactionContext,
    action: string,
    targetId: string,
    context: RequestAuditContext,
    metadata: Record<string, unknown> = {},
  ) {
    await this.deps.operationsRepository.appendAuditLog(tx, {
      actorUserId: null,
      actorType: "system",
      action,
      targetType: "payment_provider_event",
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

function createSystemRecoveryAuditContext(): RequestAuditContext {
  return {
    requestId: `recovery_${randomUUID()}`,
    ipAddressHash: null,
    userAgentHash: null,
  };
}

function depositEventPayload(deposit: DepositIntentRecord) {
  return {
    depositIntentId: deposit.id,
    provider: deposit.provider,
    providerIntentId: deposit.providerIntentId,
    amountMinor: deposit.amountMinor.toString(),
    currency: deposit.currency,
    status: deposit.status,
  };
}

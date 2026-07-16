import "server-only";

import { randomUUID } from "node:crypto";

import type { IdentityProvider } from "@/application/auth";
import { AppError } from "@/application/errors";
import type { Clock } from "@/application/ports";
import {
  assertBalancedLedgerPosting,
  createWithdrawalPaymentEntries,
  createWithdrawalReleaseEntries,
  createWithdrawalReservationEntries,
} from "@/domains/ledger";
import { assertWithdrawalTransition } from "@/domains/payments/withdrawal-state-machine";
import type {
  CoreRepository,
  DrizzleTransactionContext,
  DrizzleTransactionManager,
  IdentityRepository,
  LedgerRepository,
  NotificationRepository,
  OperationsRepository,
  PaymentRepository,
  WithdrawalRequestRecord,
} from "@/infrastructure/database";

import { createPaymentAuditContext, type RequestAuditContext } from "./deposit-engine-service";
import { MANUAL_WITHDRAWAL_PROVIDER } from "./funding-constants";
import type { AdminWithdrawalReviewInput, CreateWithdrawalRequestInput } from "./schemas";

const WITHDRAWAL_REFERENCE_PREFIX = "USWWTH";
const FINANCE_ADMIN_ROLES = new Set([
  "finance_admin",
  "finance_manager",
  "finance_officer",
  "platform_admin",
  "super_admin",
]);
const WITHDRAWAL_EMAIL_TEMPLATES = {
  requested: "withdrawal.requested",
  approved: "withdrawal.approved",
  rejected: "withdrawal.rejected",
  paid: "withdrawal.paid",
  failed: "withdrawal.failed",
  cancelled: "withdrawal.cancelled",
} as const;

export interface WithdrawalEngineServiceDependencies {
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

export interface CreateWithdrawalRequestCommand extends CreateWithdrawalRequestInput {
  idempotencyKey: string;
}

export interface CreateWithdrawalRequestResult {
  withdrawal: WithdrawalRequestRecord;
  idempotent: boolean;
}

export interface AdminWithdrawalActionResult {
  withdrawal: WithdrawalRequestRecord;
  idempotent: boolean;
}

export interface QueueWithdrawalPayoutResult {
  withdrawal: WithdrawalRequestRecord;
  idempotent: boolean;
}

export interface MarkWithdrawalPaidInput {
  withdrawalId: string;
  providerPayoutReference: string;
  context: RequestAuditContext;
}

export interface MarkWithdrawalFailedInput {
  withdrawalId: string;
  failureReason: string;
  context: RequestAuditContext;
}

export class WithdrawalEngineService {
  constructor(private readonly deps: WithdrawalEngineServiceDependencies) {}

  async listWithdrawals() {
    const appUser = await this.requireCurrentVerifiedAppUser();
    return this.deps.paymentRepository.listWithdrawalsByUserId(appUser.id);
  }

  async listWithdrawalsForAdmin(status?: WithdrawalRequestRecord["status"]) {
    await this.requireFinanceAdmin();
    if (status) {
      return this.deps.paymentRepository.listWithdrawalsByStatus(status);
    }
    return Promise.all(
      (
        [
          "under_review",
          "approved",
          "processing",
          "paid",
          "rejected",
          "failed",
          "cancelled",
        ] as const
      ).map((candidate) => this.deps.paymentRepository.listWithdrawalsByStatus(candidate, 50)),
    ).then((groups) =>
      groups.flat().sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()),
    );
  }

  async createWithdrawalRequest(
    input: CreateWithdrawalRequestCommand,
    context: RequestAuditContext,
  ): Promise<CreateWithdrawalRequestResult> {
    if (!input.idempotencyKey.trim()) {
      throw new AppError({
        code: "IDEMPOTENCY_ERROR",
        message: "An idempotency key is required for withdrawal creation.",
      });
    }

    const appUser = await this.requireCurrentVerifiedAppUser();
    await this.requireActiveCustomerAccount(appUser.id);

    const existing = await this.deps.paymentRepository.findWithdrawalByIdempotencyKey(
      input.idempotencyKey,
    );
    if (existing) {
      this.assertIdempotencyOwnership(existing, appUser.id);
      return { withdrawal: existing, idempotent: true };
    }

    const openWithdrawal = await this.deps.paymentRepository.findOpenWithdrawalByUserCurrency(
      appUser.id,
      input.currency,
    );
    if (openWithdrawal) {
      throw new AppError({
        code: "CONFLICT",
        message: "A pending withdrawal already exists for this currency.",
        details: { withdrawalId: openWithdrawal.id, status: openWithdrawal.status },
      });
    }

    const withdrawal = await this.deps.transactionManager.runInTransaction(async (tx) => {
      const created = await this.deps.paymentRepository.createWithdrawalRequest(tx, {
        userId: appUser.id,
        currency: input.currency,
        amountMinor: input.amountMinor,
        destinationType: input.destinationType,
        destinationReference: input.destinationReference,
        provider: MANUAL_WITHDRAWAL_PROVIDER,
        status: "requested",
        idempotencyKey: input.idempotencyKey,
        providerMetadata: {
          asset: input.asset ?? null,
          network: input.network ?? null,
        },
      });

      if (created.status !== "requested" || created.reservationLedgerTransactionId) {
        this.assertIdempotencyOwnership(created, appUser.id);
        return created;
      }

      await this.deps.ledgerRepository.lockWalletByUserCurrency(tx, appUser.id, input.currency);
      const balance = await this.deps.ledgerRepository.findWalletBalanceByUserCurrencyInTransaction(
        tx,
        appUser.id,
        input.currency,
      );
      if (!balance) {
        throw new AppError({ code: "INVALID_STATE", message: "Customer wallet was not found." });
      }
      if (balance.availableBalanceMinor < input.amountMinor) {
        throw new AppError({
          code: "INVALID_STATE",
          message: "Available balance is insufficient for this withdrawal.",
          details: {
            availableBalanceMinor: balance.availableBalanceMinor.toString(),
            requestedAmountMinor: input.amountMinor.toString(),
          },
        });
      }

      const availableAccount =
        await this.deps.ledgerRepository.findWalletAccountByCategoryInTransaction(tx, {
          walletId: balance.walletId,
          category: "available",
        });
      const reservedAccount =
        await this.deps.ledgerRepository.findWalletAccountByCategoryInTransaction(tx, {
          walletId: balance.walletId,
          category: "reserved",
        });
      if (!availableAccount || !reservedAccount) {
        throw new AppError({
          code: "INVALID_STATE",
          message: "Customer wallet accounts were not found.",
        });
      }

      const entries = createWithdrawalReservationEntries({
        customerAvailableAccountId: availableAccount.id,
        customerReservedAccountId: reservedAccount.id,
        amountMinor: input.amountMinor,
        currency: input.currency,
      });
      assertBalancedLedgerPosting({ entries });

      const reservationKey = `withdrawal_reservation:${created.id}`;
      const ledger = await this.deps.ledgerRepository.postLedgerTransaction(tx, {
        transaction: {
          transactionType: "withdrawal_reservation",
          idempotencyKey: reservationKey,
          referenceType: "withdrawal_request",
          referenceId: created.id,
          description: "Customer withdrawal reservation",
          metadata: {
            source: "customer",
            idempotencyKey: reservationKey,
            invariantIds: ["FI-101", "FI-102", "FI-105", "FI-501"],
          },
        },
        entries,
      });

      const locked = await this.deps.paymentRepository.lockWithdrawalById(tx, created.id);
      if (!locked) {
        throw new AppError({ code: "NOT_FOUND", message: "Withdrawal request was not found." });
      }

      assertWithdrawalTransition(locked.status, "reserved");
      const reserved = await this.deps.paymentRepository.markWithdrawalReserved(tx, locked.id, {
        reservationLedgerTransactionId: ledger.transaction.id,
      });

      assertWithdrawalTransition(reserved.status, "under_review");
      const underReview = await this.deps.paymentRepository.markWithdrawalUnderReview(
        tx,
        reserved.id,
      );

      await this.enqueueWithdrawalRequestedSideEffects(tx, underReview, appUser.email, context);
      return underReview;
    });

    return { withdrawal, idempotent: false };
  }

  async cancelWithdrawal(
    withdrawalId: string,
    context: RequestAuditContext,
  ): Promise<AdminWithdrawalActionResult> {
    const appUser = await this.requireCurrentVerifiedAppUser();

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const current = await this.deps.paymentRepository.lockWithdrawalById(tx, withdrawalId);
      if (!current) {
        throw new AppError({ code: "NOT_FOUND", message: "Withdrawal request was not found." });
      }
      if (current.userId !== appUser.id) {
        throw new AppError({
          code: "AUTHORIZATION_ERROR",
          message: "You are not authorized to cancel this withdrawal.",
        });
      }
      if (current.status === "cancelled" && current.releaseLedgerTransactionId) {
        return { withdrawal: current, idempotent: true };
      }
      if (current.status !== "reserved") {
        throw new AppError({
          code: "INVALID_STATE",
          message: "Only reserved withdrawals can be cancelled by the customer.",
        });
      }

      const released = await this.postWithdrawalRelease(tx, current, "cancelled", context, {
        actorUserId: appUser.id,
        actorType: "customer",
      });
      const cancelled = await this.deps.paymentRepository.markWithdrawalCancelled(tx, released.id, {
        releaseLedgerTransactionId: released.releaseLedgerTransactionId!,
      });
      await this.enqueueWithdrawalCancelledSideEffects(tx, cancelled, context);
      return { withdrawal: cancelled, idempotent: false };
    });
  }

  async approveWithdrawal(
    withdrawalId: string,
    input: AdminWithdrawalReviewInput,
    context: RequestAuditContext,
  ): Promise<AdminWithdrawalActionResult> {
    const admin = await this.requireFinanceAdmin();

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const current = await this.deps.paymentRepository.lockWithdrawalById(tx, withdrawalId);
      if (!current) {
        throw new AppError({ code: "NOT_FOUND", message: "Withdrawal request was not found." });
      }
      if (current.status === "approved" && current.reviewedBy === admin.id) {
        return { withdrawal: current, idempotent: true };
      }

      assertWithdrawalTransition(current.status, "approved");
      const approved = await this.deps.paymentRepository.markWithdrawalApproved(tx, current.id, {
        reviewedBy: admin.id,
        reviewReason: input.reason,
      });
      await this.appendAdminAudit(tx, admin.id, "withdrawal.approved", approved.id, context, {
        reviewReason: input.reason,
      });
      await this.enqueueWithdrawalApprovedSideEffects(tx, approved, context);
      return { withdrawal: approved, idempotent: false };
    });
  }

  async rejectWithdrawal(
    withdrawalId: string,
    input: AdminWithdrawalReviewInput,
    context: RequestAuditContext,
  ): Promise<AdminWithdrawalActionResult> {
    const admin = await this.requireFinanceAdmin();

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const current = await this.deps.paymentRepository.lockWithdrawalById(tx, withdrawalId);
      if (!current) {
        throw new AppError({ code: "NOT_FOUND", message: "Withdrawal request was not found." });
      }
      if (current.status === "rejected" && current.releaseLedgerTransactionId) {
        return { withdrawal: current, idempotent: true };
      }

      assertWithdrawalTransition(current.status, "rejected");
      const released = await this.postWithdrawalRelease(tx, current, "rejected", context, {
        actorUserId: admin.id,
        actorType: "admin",
        reviewReason: input.reason,
      });
      const rejected = await this.deps.paymentRepository.markWithdrawalRejected(tx, released.id, {
        reviewedBy: admin.id,
        reviewReason: input.reason,
        releaseLedgerTransactionId: released.releaseLedgerTransactionId!,
      });
      await this.enqueueWithdrawalRejectedSideEffects(tx, rejected, context);
      return { withdrawal: rejected, idempotent: false };
    });
  }

  async queueWithdrawalPayout(
    withdrawalId: string,
    context: RequestAuditContext,
  ): Promise<QueueWithdrawalPayoutResult> {
    const admin = await this.requireFinanceAdmin();

    const current = await this.deps.paymentRepository.findWithdrawalById(withdrawalId);
    if (!current) {
      throw new AppError({ code: "NOT_FOUND", message: "Withdrawal request was not found." });
    }
    if (current.status === "processing" && current.providerPayoutReference) {
      return { withdrawal: current, idempotent: true };
    }
    if (current.status !== "approved") {
      throw new AppError({
        code: "INVALID_STATE",
        message: "Only approved withdrawals can be queued for payout.",
      });
    }

    const payoutReference = createWithdrawalPayoutReference(current.id);

    const processing = await this.deps.transactionManager.runInTransaction(async (tx) => {
      const locked = await this.deps.paymentRepository.lockWithdrawalById(tx, withdrawalId);
      if (!locked) {
        throw new AppError({ code: "NOT_FOUND", message: "Withdrawal request was not found." });
      }
      if (locked.status === "processing" && locked.providerPayoutReference) {
        return locked;
      }

      assertWithdrawalTransition(locked.status, "processing");
      const updated = await this.deps.paymentRepository.markWithdrawalProcessing(tx, locked.id, {
        provider: MANUAL_WITHDRAWAL_PROVIDER,
        providerPayoutReference: payoutReference,
        providerMetadata: locked.providerMetadata,
      });
      await this.appendAdminAudit(tx, admin.id, "withdrawal.payout_queued", updated.id, context, {
        providerPayoutReference: payoutReference,
      });
      return updated;
    });

    return { withdrawal: processing, idempotent: false };
  }

  async markWithdrawalPaid(input: MarkWithdrawalPaidInput): Promise<AdminWithdrawalActionResult> {
    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const current = await this.deps.paymentRepository.lockWithdrawalById(tx, input.withdrawalId);
      if (!current) {
        throw new AppError({ code: "NOT_FOUND", message: "Withdrawal request was not found." });
      }
      if (current.status === "paid" && current.paymentLedgerTransactionId) {
        return { withdrawal: current, idempotent: true };
      }
      if (current.status !== "approved" && current.status !== "processing") {
        throw new AppError({
          code: "INVALID_STATE",
          message: "Only approved or processing withdrawals can be marked paid.",
        });
      }

      assertWithdrawalTransition(current.status, "paid");
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

      const reservedAccount =
        await this.deps.ledgerRepository.findWalletAccountByCategoryInTransaction(tx, {
          walletId: balance.walletId,
          category: "reserved",
        });
      const withdrawnAccount =
        await this.deps.ledgerRepository.findWalletAccountByCategoryInTransaction(tx, {
          walletId: balance.walletId,
          category: "withdrawn",
        });
      if (!reservedAccount || !withdrawnAccount) {
        throw new AppError({
          code: "INVALID_STATE",
          message: "Customer wallet accounts were not found.",
        });
      }

      const entries = createWithdrawalPaymentEntries({
        customerReservedAccountId: reservedAccount.id,
        customerWithdrawnAccountId: withdrawnAccount.id,
        amountMinor: current.amountMinor,
        currency: current.currency,
      });
      assertBalancedLedgerPosting({ entries });

      const paymentKey = `withdrawal_payment:${current.id}:${input.providerPayoutReference}`;
      const ledger = await this.deps.ledgerRepository.postLedgerTransaction(tx, {
        transaction: {
          transactionType: "withdrawal_payment",
          idempotencyKey: paymentKey,
          referenceType: "withdrawal_request",
          referenceId: current.id,
          description: "Customer withdrawal payment",
          metadata: {
            source: "admin",
            idempotencyKey: paymentKey,
            providerPayoutReference: input.providerPayoutReference,
            invariantIds: ["FI-101", "FI-102", "FI-105", "FI-501"],
          },
        },
        entries,
      });

      const paid = await this.deps.paymentRepository.markWithdrawalPaid(tx, current.id, {
        paymentLedgerTransactionId: ledger.transaction.id,
      });
      await this.appendAdminAudit(tx, null, "withdrawal.paid", paid.id, input.context, {
        paymentLedgerTransactionId: ledger.transaction.id,
        providerPayoutReference: input.providerPayoutReference,
      });
      await this.enqueueWithdrawalPaidSideEffects(tx, paid, input.context);
      return { withdrawal: paid, idempotent: false };
    });
  }

  async markWithdrawalFailed(
    input: MarkWithdrawalFailedInput,
  ): Promise<AdminWithdrawalActionResult> {
    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const current = await this.deps.paymentRepository.lockWithdrawalById(tx, input.withdrawalId);
      if (!current) {
        throw new AppError({ code: "NOT_FOUND", message: "Withdrawal request was not found." });
      }
      if (current.status === "failed" && current.releaseLedgerTransactionId) {
        return { withdrawal: current, idempotent: true };
      }

      assertWithdrawalTransition(current.status, "failed");
      const released = await this.postWithdrawalRelease(tx, current, "failed", input.context, {
        actorType: "system",
        failureReason: input.failureReason,
      });
      const failed = await this.deps.paymentRepository.markWithdrawalFailed(tx, released.id, {
        failureReason: input.failureReason,
        releaseLedgerTransactionId: released.releaseLedgerTransactionId!,
      });
      await this.enqueueWithdrawalFailedSideEffects(tx, failed, input.context);
      return { withdrawal: failed, idempotent: false };
    });
  }

  private async postWithdrawalRelease(
    tx: DrizzleTransactionContext,
    withdrawal: WithdrawalRequestRecord,
    releaseReason: "rejected" | "cancelled" | "failed",
    context: RequestAuditContext,
    audit: {
      actorUserId?: string | null;
      actorType: "customer" | "admin" | "system";
      reviewReason?: string;
      failureReason?: string;
    },
  ): Promise<WithdrawalRequestRecord> {
    if (withdrawal.releaseLedgerTransactionId) {
      return withdrawal;
    }

    await this.deps.ledgerRepository.lockWalletByUserCurrency(
      tx,
      withdrawal.userId,
      withdrawal.currency,
    );
    const balance = await this.deps.ledgerRepository.findWalletBalanceByUserCurrencyInTransaction(
      tx,
      withdrawal.userId,
      withdrawal.currency,
    );
    if (!balance) {
      throw new AppError({ code: "INVALID_STATE", message: "Customer wallet was not found." });
    }

    const reservedAccount =
      await this.deps.ledgerRepository.findWalletAccountByCategoryInTransaction(tx, {
        walletId: balance.walletId,
        category: "reserved",
      });
    const availableAccount =
      await this.deps.ledgerRepository.findWalletAccountByCategoryInTransaction(tx, {
        walletId: balance.walletId,
        category: "available",
      });
    if (!reservedAccount || !availableAccount) {
      throw new AppError({
        code: "INVALID_STATE",
        message: "Customer wallet accounts were not found.",
      });
    }

    const entries = createWithdrawalReleaseEntries({
      customerReservedAccountId: reservedAccount.id,
      customerAvailableAccountId: availableAccount.id,
      amountMinor: withdrawal.amountMinor,
      currency: withdrawal.currency,
    });
    assertBalancedLedgerPosting({ entries });

    const releaseKey = `withdrawal_release:${withdrawal.id}:${releaseReason}`;
    const ledger = await this.deps.ledgerRepository.postLedgerTransaction(tx, {
      transaction: {
        transactionType: "withdrawal_release",
        idempotencyKey: releaseKey,
        referenceType: "withdrawal_request",
        referenceId: withdrawal.id,
        description: "Customer withdrawal release",
        metadata: {
          source: audit.actorType === "system" ? "admin" : audit.actorType,
          idempotencyKey: releaseKey,
          releaseReason,
          reviewReason: audit.reviewReason,
          failureReason: audit.failureReason,
          invariantIds: ["FI-101", "FI-102", "FI-105", "FI-501"],
        },
      },
      entries,
    });

    const updated = { ...withdrawal, releaseLedgerTransactionId: ledger.transaction.id };
    if (audit.actorType === "admin" && audit.actorUserId) {
      await this.appendAdminAudit(
        tx,
        audit.actorUserId,
        "withdrawal.released",
        withdrawal.id,
        context,
        {
          releaseReason,
          releaseLedgerTransactionId: ledger.transaction.id,
          reviewReason: audit.reviewReason,
        },
      );
    } else if (audit.actorType === "customer" && audit.actorUserId) {
      await this.appendCustomerAudit(
        tx,
        audit.actorUserId,
        "withdrawal.released",
        withdrawal.id,
        context,
        {
          releaseReason,
          releaseLedgerTransactionId: ledger.transaction.id,
        },
      );
    } else {
      await this.appendSystemAudit(tx, "withdrawal.released", withdrawal.id, context, {
        releaseReason,
        releaseLedgerTransactionId: ledger.transaction.id,
        failureReason: audit.failureReason,
      });
    }

    return updated;
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
        message: "Email verification is required before creating withdrawals.",
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
        message: "An active customer account is required before creating withdrawals.",
      });
    }
    return account;
  }

  private assertIdempotencyOwnership(withdrawal: WithdrawalRequestRecord, userId: string) {
    if (withdrawal.userId !== userId) {
      throw new AppError({
        code: "IDEMPOTENCY_ERROR",
        message: "Idempotency key belongs to a different customer.",
      });
    }
  }

  private async enqueueWithdrawalRequestedSideEffects(
    tx: DrizzleTransactionContext,
    withdrawal: WithdrawalRequestRecord,
    email: string,
    context: RequestAuditContext,
  ) {
    await this.deps.notificationRepository.enqueueOutboxEvent(tx, {
      eventType: "withdrawal.requested",
      aggregateType: "withdrawal_request",
      aggregateId: withdrawal.id,
      payload: withdrawalEventPayload(withdrawal),
    });
    await this.deps.notificationRepository.createNotification(tx, {
      userId: withdrawal.userId,
      type: "withdrawal.requested",
      title: "Withdrawal requested",
      body: "Your withdrawal request is under review.",
      priority: "info",
      data: withdrawalEventPayload(withdrawal),
    });
    await this.deps.notificationRepository.enqueueEmail(tx, {
      recipientUserId: withdrawal.userId,
      toEmail: email,
      templateKey: WITHDRAWAL_EMAIL_TEMPLATES.requested,
      templateVersion: "v1",
      idempotencyKey: `withdrawal.requested:${withdrawal.id}`,
      metadata: withdrawalEventPayload(withdrawal),
    });
    await this.appendCustomerAudit(
      tx,
      withdrawal.userId,
      "withdrawal.reserved",
      withdrawal.id,
      context,
      {
        reservationLedgerTransactionId: withdrawal.reservationLedgerTransactionId,
      },
    );
  }

  private async enqueueWithdrawalApprovedSideEffects(
    tx: DrizzleTransactionContext,
    withdrawal: WithdrawalRequestRecord,
    context: RequestAuditContext,
  ) {
    const user = await this.deps.identityRepository.findUserById(withdrawal.userId);
    await this.deps.notificationRepository.enqueueOutboxEvent(tx, {
      eventType: "withdrawal.approved",
      aggregateType: "withdrawal_request",
      aggregateId: withdrawal.id,
      payload: withdrawalEventPayload(withdrawal),
    });
    await this.deps.notificationRepository.createNotification(tx, {
      userId: withdrawal.userId,
      type: "withdrawal.approved",
      title: "Withdrawal approved",
      body: "Your withdrawal request has been approved.",
      priority: "success",
      data: withdrawalEventPayload(withdrawal),
    });
    if (user) {
      await this.deps.notificationRepository.enqueueEmail(tx, {
        recipientUserId: withdrawal.userId,
        toEmail: user.email,
        templateKey: WITHDRAWAL_EMAIL_TEMPLATES.approved,
        templateVersion: "v1",
        idempotencyKey: `withdrawal.approved:${withdrawal.id}`,
        metadata: withdrawalEventPayload(withdrawal),
      });
    }
    await this.appendCustomerAudit(
      tx,
      withdrawal.userId,
      "withdrawal.approved",
      withdrawal.id,
      context,
    );
  }

  private async enqueueWithdrawalRejectedSideEffects(
    tx: DrizzleTransactionContext,
    withdrawal: WithdrawalRequestRecord,
    context: RequestAuditContext,
  ) {
    const user = await this.deps.identityRepository.findUserById(withdrawal.userId);
    await this.deps.notificationRepository.enqueueOutboxEvent(tx, {
      eventType: "withdrawal.rejected",
      aggregateType: "withdrawal_request",
      aggregateId: withdrawal.id,
      payload: withdrawalEventPayload(withdrawal),
    });
    await this.deps.notificationRepository.createNotification(tx, {
      userId: withdrawal.userId,
      type: "withdrawal.rejected",
      title: "Withdrawal rejected",
      body: "Your withdrawal request was rejected and funds were released.",
      priority: "warning",
      data: withdrawalEventPayload(withdrawal),
    });
    if (user) {
      await this.deps.notificationRepository.enqueueEmail(tx, {
        recipientUserId: withdrawal.userId,
        toEmail: user.email,
        templateKey: WITHDRAWAL_EMAIL_TEMPLATES.rejected,
        templateVersion: "v1",
        idempotencyKey: `withdrawal.rejected:${withdrawal.id}`,
        metadata: withdrawalEventPayload(withdrawal),
      });
    }
    await this.appendCustomerAudit(
      tx,
      withdrawal.userId,
      "withdrawal.rejected",
      withdrawal.id,
      context,
      {
        releaseLedgerTransactionId: withdrawal.releaseLedgerTransactionId,
      },
    );
  }

  private async enqueueWithdrawalPaidSideEffects(
    tx: DrizzleTransactionContext,
    withdrawal: WithdrawalRequestRecord,
    context: RequestAuditContext,
  ) {
    const user = await this.deps.identityRepository.findUserById(withdrawal.userId);
    await this.deps.notificationRepository.enqueueOutboxEvent(tx, {
      eventType: "withdrawal.paid",
      aggregateType: "withdrawal_request",
      aggregateId: withdrawal.id,
      payload: withdrawalEventPayload(withdrawal),
    });
    await this.deps.notificationRepository.createNotification(tx, {
      userId: withdrawal.userId,
      type: "withdrawal.paid",
      title: "Withdrawal paid",
      body: "Your withdrawal has been paid out.",
      priority: "success",
      data: withdrawalEventPayload(withdrawal),
    });
    if (user) {
      await this.deps.notificationRepository.enqueueEmail(tx, {
        recipientUserId: withdrawal.userId,
        toEmail: user.email,
        templateKey: WITHDRAWAL_EMAIL_TEMPLATES.paid,
        templateVersion: "v1",
        idempotencyKey: `withdrawal.paid:${withdrawal.id}`,
        metadata: withdrawalEventPayload(withdrawal),
      });
    }
    await this.appendCustomerAudit(
      tx,
      withdrawal.userId,
      "withdrawal.paid",
      withdrawal.id,
      context,
      {
        paymentLedgerTransactionId: withdrawal.paymentLedgerTransactionId,
        providerPayoutReference: withdrawal.providerPayoutReference,
      },
    );
  }

  private async enqueueWithdrawalFailedSideEffects(
    tx: DrizzleTransactionContext,
    withdrawal: WithdrawalRequestRecord,
    context: RequestAuditContext,
  ) {
    const user = await this.deps.identityRepository.findUserById(withdrawal.userId);
    await this.deps.notificationRepository.enqueueOutboxEvent(tx, {
      eventType: "withdrawal.failed",
      aggregateType: "withdrawal_request",
      aggregateId: withdrawal.id,
      payload: withdrawalEventPayload(withdrawal),
    });
    await this.deps.notificationRepository.createNotification(tx, {
      userId: withdrawal.userId,
      type: "withdrawal.failed",
      title: "Withdrawal failed",
      body: "Your withdrawal payout failed and funds were released.",
      priority: "warning",
      data: withdrawalEventPayload(withdrawal),
    });
    if (user) {
      await this.deps.notificationRepository.enqueueEmail(tx, {
        recipientUserId: withdrawal.userId,
        toEmail: user.email,
        templateKey: WITHDRAWAL_EMAIL_TEMPLATES.failed,
        templateVersion: "v1",
        idempotencyKey: `withdrawal.failed:${withdrawal.id}`,
        metadata: withdrawalEventPayload(withdrawal),
      });
    }
    await this.appendCustomerAudit(
      tx,
      withdrawal.userId,
      "withdrawal.failed",
      withdrawal.id,
      context,
      {
        releaseLedgerTransactionId: withdrawal.releaseLedgerTransactionId,
        failureReason: withdrawal.failureReason,
      },
    );
  }

  private async enqueueWithdrawalCancelledSideEffects(
    tx: DrizzleTransactionContext,
    withdrawal: WithdrawalRequestRecord,
    context: RequestAuditContext,
  ) {
    const user = await this.deps.identityRepository.findUserById(withdrawal.userId);
    await this.deps.notificationRepository.enqueueOutboxEvent(tx, {
      eventType: "withdrawal.cancelled",
      aggregateType: "withdrawal_request",
      aggregateId: withdrawal.id,
      payload: withdrawalEventPayload(withdrawal),
    });
    await this.deps.notificationRepository.createNotification(tx, {
      userId: withdrawal.userId,
      type: "withdrawal.cancelled",
      title: "Withdrawal cancelled",
      body: "Your withdrawal was cancelled and funds were released.",
      priority: "info",
      data: withdrawalEventPayload(withdrawal),
    });
    if (user) {
      await this.deps.notificationRepository.enqueueEmail(tx, {
        recipientUserId: withdrawal.userId,
        toEmail: user.email,
        templateKey: WITHDRAWAL_EMAIL_TEMPLATES.cancelled,
        templateVersion: "v1",
        idempotencyKey: `withdrawal.cancelled:${withdrawal.id}`,
        metadata: withdrawalEventPayload(withdrawal),
      });
    }
    await this.appendCustomerAudit(
      tx,
      withdrawal.userId,
      "withdrawal.cancelled",
      withdrawal.id,
      context,
    );
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
      targetType: "withdrawal_request",
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
    const reasonCandidate = metadata.reason ?? metadata.reviewReason;
    const reason = typeof reasonCandidate === "string" ? reasonCandidate : undefined;
    await this.deps.operationsRepository.appendAuditLog(tx, {
      actorUserId,
      actorType: "admin",
      action,
      targetType: "withdrawal_request",
      targetId,
      ...(reason ? { reason } : {}),
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
      targetType: "withdrawal_request",
      targetId,
      metadata,
      requestId: context.requestId,
      ipAddressHash: context.ipAddressHash,
      userAgentHash: context.userAgentHash,
    });
  }
}

export { createPaymentAuditContext };

function createWithdrawalPayoutReference(withdrawalId: string) {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 24).toUpperCase();
  return `${WITHDRAWAL_REFERENCE_PREFIX}-${withdrawalId.slice(0, 8)}-${suffix}`;
}

function withdrawalEventPayload(withdrawal: WithdrawalRequestRecord) {
  return {
    withdrawalId: withdrawal.id,
    amountMinor: withdrawal.amountMinor.toString(),
    currency: withdrawal.currency,
    status: withdrawal.status,
    destinationType: withdrawal.destinationType,
    provider: withdrawal.provider,
    providerPayoutReference: withdrawal.providerPayoutReference,
  };
}

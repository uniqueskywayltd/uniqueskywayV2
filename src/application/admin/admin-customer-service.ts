import "server-only";

import type { IdentityProvider } from "@/application/auth";
import {
  hashIpAddress,
  hashUserAgent,
  type RequestSecurityContext,
} from "@/application/auth/security";
import { AppError } from "@/application/errors";
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
  OperationsRepository,
  UserRecord,
} from "@/infrastructure/database";

import { requireAdminActor } from "./require-admin";
import type {
  AddCustomerNoteInput,
  SearchCustomersInput,
  UpdateCustomerKycInput,
  UpdateCustomerStatusInput,
} from "./schemas";

export interface AdminCustomerServiceDependencies {
  identityProvider?: IdentityProvider;
  transactionManager: DrizzleTransactionManager;
  identityRepository: IdentityRepository;
  coreRepository: CoreRepository;
  operationsRepository: OperationsRepository;
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
  constructor(private readonly deps: AdminCustomerServiceDependencies) {}

  async searchCustomers(input: SearchCustomersInput): Promise<SearchCustomersResultView> {
    await requireAdminActor(this.deps, "admin.users.read");

    return this.deps.coreRepository.searchCustomers({
      ...(input.q ? { q: input.q } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.kycStatus ? { kycStatus: input.kycStatus } : {}),
      limit: input.limit,
      ...(input.cursor ? { cursor: input.cursor } : {}),
    });
  }

  async getCustomerDetails(userId: string): Promise<CustomerDetails> {
    await requireAdminActor(this.deps, "admin.users.read");
    return this.loadCustomerDetails(userId);
  }

  async updateCustomerStatus(
    userId: string,
    input: UpdateCustomerStatusInput,
    context: RequestAuditContext,
  ): Promise<CustomerDetails> {
    const admin = await requireAdminActor(this.deps, "admin.users.restrict");

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

  async updateCustomerVerification(
    userId: string,
    input: UpdateCustomerKycInput,
    context: RequestAuditContext,
  ): Promise<CustomerDetails> {
    const admin = await requireAdminActor(this.deps, "admin.kyc.review");

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
    const admin = await requireAdminActor(this.deps, "admin.users.notes.write");

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
    await requireAdminActor(this.deps, "admin.users.read");
    return this.deps.coreRepository.listCustomerNotesByUserId(userId, limit);
  }

  async getCustomerAuditTimeline(userId: string, limit = 50): Promise<AuditLogRecord[]> {
    await requireAdminActor(this.deps, "admin.users.read");
    return this.deps.operationsRepository.listAuditLogsForCustomerTimeline(userId, limit);
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

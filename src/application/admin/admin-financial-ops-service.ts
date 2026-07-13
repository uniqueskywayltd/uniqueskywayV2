import "server-only";

import type { IdentityProvider } from "@/application/auth";
import { AppError } from "@/application/errors";
import type { Clock } from "@/application/ports";
import type {
  AdminDepositActionResult,
  AdminWithdrawalActionResult,
  DepositEngineService,
  QueueWithdrawalPayoutResult,
  WithdrawalEngineService,
} from "@/application/payments";
import type {
  AdminEntityNoteRecord,
  AuditLogRecord,
  BackgroundJobRecord,
  CoreRepository,
  DepositIntentRecord,
  DrizzleTransactionManager,
  IdentityRepository,
  InvestmentRecord,
  InvestmentRepository,
  LedgerRepository,
  NotificationRepository,
  OperationsRepository,
  PaymentProviderEventRecord,
  PaymentRepository,
  RoiScheduleItemRecord,
  SettlementItemRecord,
  SettlementRepository,
  SettlementRunRecord,
  WithdrawalRequestRecord,
} from "@/infrastructure/database";

import { createAdminAuditContext, type RequestAuditContext } from "./admin-customer-service";
import type {
  AddFinancialNoteInput,
  ListBackgroundJobsInput,
  ListProviderEventsInput,
  ListSettlementRunsInput,
  SearchDepositsInput,
  SearchInvestmentsInput,
  SearchWithdrawalsInput,
} from "./financial-ops-schemas";
import { requireAdminActor } from "./require-admin";

const DEPOSIT_STATUS_AUDIT_ACTIONS = new Set([
  "deposit.created",
  "deposit.initiated",
  "deposit.provider_initialization_failed",
  "deposit.confirmed",
  "deposit.failed",
  "deposit.cancelled",
  "deposit.reversed",
  "deposit.approved",
  "deposit.rejected",
]);

export interface AdminFinancialOpsServiceDependencies {
  identityProvider?: IdentityProvider;
  clock: Clock;
  transactionManager: DrizzleTransactionManager;
  identityRepository: IdentityRepository;
  coreRepository: CoreRepository;
  paymentRepository: PaymentRepository;
  ledgerRepository: LedgerRepository;
  investmentRepository: InvestmentRepository;
  settlementRepository: SettlementRepository;
  operationsRepository: OperationsRepository;
  notificationRepository: NotificationRepository;
  depositEngine: DepositEngineService;
  withdrawalEngine: WithdrawalEngineService;
}

export interface SearchDepositsResultView {
  rows: DepositIntentRecord[];
  nextCursor: string | null;
}

export interface SearchWithdrawalsResultView {
  rows: WithdrawalRequestRecord[];
  nextCursor: string | null;
}

export interface DepositDetailsView {
  deposit: DepositIntentRecord;
  providerEvents: PaymentProviderEventRecord[];
  notes: AdminEntityNoteRecord[];
}

export interface WithdrawalDetailsView {
  withdrawal: WithdrawalRequestRecord;
  providerEvents: PaymentProviderEventRecord[];
  notes: AdminEntityNoteRecord[];
}

export interface SearchInvestmentsResultView {
  rows: InvestmentRecord[];
  nextCursor: string | null;
}

export interface InvestmentDetailsView {
  investment: InvestmentRecord;
  roiScheduleItems: RoiScheduleItemRecord[];
  settlementItems: SettlementItemRecord[];
  postedRoiMinor: bigint;
}

export interface ListSettlementRunsResultView {
  rows: SettlementRunRecord[];
  nextCursor: string | null;
}

export interface SettlementRunDetailsView {
  run: SettlementRunRecord;
  items: SettlementItemRecord[];
}

export interface MonitoringSnapshotView {
  pendingDeposits: number;
  pendingWithdrawals: number;
  underReviewWithdrawals: number;
  failedProviderEvents: number;
  deadLetteredProviderEvents: number;
  failedBackgroundJobs: number;
  retryableProviderEvents: number;
}

export interface OverviewMetricsView {
  pendingDeposits: number;
  pendingWithdrawals: number;
  underReviewWithdrawals: number;
  depositsToday: number;
  withdrawalsToday: number;
  pendingReviews: number;
  failedJobs: number;
  failedWebhooks: number;
  deadLetteredWebhooks: number;
  recentActivity: AuditLogRecord[];
}

export class AdminFinancialOpsService {
  constructor(private readonly deps: AdminFinancialOpsServiceDependencies) {}

  async searchDeposits(filters: SearchDepositsInput): Promise<SearchDepositsResultView> {
    await requireAdminActor(this.deps, "deposits.read");
    return this.deps.paymentRepository.searchDepositIntents({
      ...(filters.q ? { q: filters.q } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.from ? { from: filters.from } : {}),
      ...(filters.to ? { to: filters.to } : {}),
      ...(filters.cursor ? { cursor: filters.cursor } : {}),
      limit: filters.limit,
    });
  }

  async getDepositDetails(depositId: string): Promise<DepositDetailsView> {
    await requireAdminActor(this.deps, "deposits.read");

    const deposit = await this.deps.paymentRepository.findDepositIntentById(depositId);
    if (!deposit) {
      throw new AppError({ code: "NOT_FOUND", message: "Deposit intent was not found." });
    }

    const [providerEvents, notes] = await Promise.all([
      this.deps.paymentRepository.findProviderEventsRelatedToReference(deposit.providerIntentId),
      this.deps.operationsRepository.listAdminEntityNotes("deposit_intent", depositId, 20),
    ]);

    return { deposit, providerEvents, notes };
  }

  async getDepositTimeline(depositId: string, limit = 50): Promise<AuditLogRecord[]> {
    await requireAdminActor(this.deps, "deposits.read");
    return this.deps.operationsRepository.listAuditLogsByTarget("deposit_intent", depositId, limit);
  }

  async getDepositStatusHistory(depositId: string, limit = 50): Promise<AuditLogRecord[]> {
    await requireAdminActor(this.deps, "deposits.read");
    const timeline = await this.deps.operationsRepository.listAuditLogsByTarget(
      "deposit_intent",
      depositId,
      limit,
    );
    return timeline.filter((entry) => DEPOSIT_STATUS_AUDIT_ACTIONS.has(entry.action));
  }

  async listDepositNotes(depositId: string, limit = 50): Promise<AdminEntityNoteRecord[]> {
    await requireAdminActor(this.deps, "deposits.read");
    return this.deps.operationsRepository.listAdminEntityNotes("deposit_intent", depositId, limit);
  }

  async addDepositNote(
    depositId: string,
    input: AddFinancialNoteInput,
    context: RequestAuditContext,
  ): Promise<AdminEntityNoteRecord> {
    const admin = await requireAdminActor(this.deps, "deposits.review");

    const deposit = await this.deps.paymentRepository.findDepositIntentById(depositId);
    if (!deposit) {
      throw new AppError({ code: "NOT_FOUND", message: "Deposit intent was not found." });
    }

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const note = await this.deps.operationsRepository.createAdminEntityNote(tx, {
        targetType: "deposit_intent",
        targetId: depositId,
        authorUserId: admin.appUser.id,
        body: input.body.trim(),
      });

      await this.deps.operationsRepository.appendAuditLog(tx, {
        actorUserId: admin.appUser.id,
        actorType: "admin",
        action: "deposit.note_added",
        targetType: "deposit_intent",
        targetId: depositId,
        metadata: { noteId: note.id },
        requestId: context.requestId,
        ipAddressHash: context.ipAddressHash,
        userAgentHash: context.userAgentHash,
      });

      return note;
    });
  }

  async approveDeposit(
    depositId: string,
    reason: string,
    context: RequestAuditContext,
  ): Promise<AdminDepositActionResult> {
    await requireAdminActor(this.deps, "deposits.approve");
    return this.deps.depositEngine.adminApproveDeposit(depositId, reason, context);
  }

  async rejectDeposit(
    depositId: string,
    reason: string,
    context: RequestAuditContext,
  ): Promise<AdminDepositActionResult> {
    await requireAdminActor(this.deps, "deposits.approve");
    return this.deps.depositEngine.adminRejectDeposit(depositId, reason, context);
  }

  async searchWithdrawals(filters: SearchWithdrawalsInput): Promise<SearchWithdrawalsResultView> {
    await requireAdminActor(this.deps, "withdrawals.read");
    return this.deps.paymentRepository.searchWithdrawals({
      ...(filters.q ? { q: filters.q } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.from ? { from: filters.from } : {}),
      ...(filters.to ? { to: filters.to } : {}),
      ...(filters.cursor ? { cursor: filters.cursor } : {}),
      limit: filters.limit,
    });
  }

  async getWithdrawalDetails(withdrawalId: string): Promise<WithdrawalDetailsView> {
    await requireAdminActor(this.deps, "withdrawals.read");

    const withdrawal = await this.deps.paymentRepository.findWithdrawalById(withdrawalId);
    if (!withdrawal) {
      throw new AppError({ code: "NOT_FOUND", message: "Withdrawal request was not found." });
    }

    const [providerEvents, notes] = await Promise.all([
      withdrawal.providerPayoutReference
        ? this.deps.paymentRepository.findProviderEventsRelatedToReference(
            withdrawal.providerPayoutReference,
          )
        : Promise.resolve([] as PaymentProviderEventRecord[]),
      this.deps.operationsRepository.listAdminEntityNotes("withdrawal_request", withdrawalId, 20),
    ]);

    return { withdrawal, providerEvents, notes };
  }

  async getWithdrawalTimeline(withdrawalId: string, limit = 50): Promise<AuditLogRecord[]> {
    await requireAdminActor(this.deps, "withdrawals.read");
    return this.deps.operationsRepository.listAuditLogsByTarget(
      "withdrawal_request",
      withdrawalId,
      limit,
    );
  }

  async listWithdrawalNotes(withdrawalId: string, limit = 50): Promise<AdminEntityNoteRecord[]> {
    await requireAdminActor(this.deps, "withdrawals.read");
    return this.deps.operationsRepository.listAdminEntityNotes(
      "withdrawal_request",
      withdrawalId,
      limit,
    );
  }

  async addWithdrawalNote(
    withdrawalId: string,
    input: AddFinancialNoteInput,
    context: RequestAuditContext,
  ): Promise<AdminEntityNoteRecord> {
    const admin = await requireAdminActor(this.deps, "withdrawals.review");

    const withdrawal = await this.deps.paymentRepository.findWithdrawalById(withdrawalId);
    if (!withdrawal) {
      throw new AppError({ code: "NOT_FOUND", message: "Withdrawal request was not found." });
    }

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const note = await this.deps.operationsRepository.createAdminEntityNote(tx, {
        targetType: "withdrawal_request",
        targetId: withdrawalId,
        authorUserId: admin.appUser.id,
        body: input.body.trim(),
      });

      await this.deps.operationsRepository.appendAuditLog(tx, {
        actorUserId: admin.appUser.id,
        actorType: "admin",
        action: "withdrawal.note_added",
        targetType: "withdrawal_request",
        targetId: withdrawalId,
        metadata: { noteId: note.id },
        requestId: context.requestId,
        ipAddressHash: context.ipAddressHash,
        userAgentHash: context.userAgentHash,
      });

      return note;
    });
  }

  async approveWithdrawal(
    withdrawalId: string,
    reason: string,
    context: RequestAuditContext,
  ): Promise<AdminWithdrawalActionResult> {
    await requireAdminActor(this.deps, "withdrawals.approve");
    return this.deps.withdrawalEngine.approveWithdrawal(withdrawalId, { reason }, context);
  }

  async rejectWithdrawal(
    withdrawalId: string,
    reason: string,
    context: RequestAuditContext,
  ): Promise<AdminWithdrawalActionResult> {
    await requireAdminActor(this.deps, "withdrawals.approve");
    return this.deps.withdrawalEngine.rejectWithdrawal(withdrawalId, { reason }, context);
  }

  async queueWithdrawal(
    withdrawalId: string,
    context: RequestAuditContext,
  ): Promise<QueueWithdrawalPayoutResult> {
    await requireAdminActor(this.deps, "withdrawals.approve");
    return this.deps.withdrawalEngine.queueWithdrawalPayout(withdrawalId, context);
  }

  async listProcessingQueue(limit = 50): Promise<WithdrawalRequestRecord[]> {
    await requireAdminActor(this.deps, "withdrawals.read");
    const result = await this.deps.paymentRepository.searchWithdrawals({
      status: "processing",
      limit,
    });
    return result.rows;
  }

  async listApprovedAwaitingPayout(limit = 50): Promise<WithdrawalRequestRecord[]> {
    await requireAdminActor(this.deps, "withdrawals.read");
    const result = await this.deps.paymentRepository.searchWithdrawals({
      status: "approved",
      limit,
    });
    return result.rows;
  }

  async searchInvestments(filters: SearchInvestmentsInput): Promise<SearchInvestmentsResultView> {
    await requireAdminActor(this.deps, "investments.read");
    return this.deps.investmentRepository.listInvestments({
      ...(filters.q ? { q: filters.q } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.cursor ? { cursor: filters.cursor } : {}),
      limit: filters.limit,
    });
  }

  async getInvestmentDetails(investmentId: string): Promise<InvestmentDetailsView> {
    await requireAdminActor(this.deps, "investments.read");

    const investment = await this.deps.investmentRepository.findInvestmentById(investmentId);
    if (!investment) {
      throw new AppError({ code: "NOT_FOUND", message: "Investment was not found." });
    }

    const [roiScheduleItems, settlementItems, postedRoiMinor] = await Promise.all([
      this.deps.investmentRepository.listRoiScheduleItemsByInvestmentId(investmentId),
      this.deps.settlementRepository.listSettlementItemsByInvestmentId(investmentId),
      this.deps.settlementRepository.sumPostedRoiMinorByInvestment(investmentId),
    ]);

    return { investment, roiScheduleItems, settlementItems, postedRoiMinor };
  }

  async listSettlementRuns(filters: ListSettlementRunsInput): Promise<ListSettlementRunsResultView> {
    await requireAdminActor(this.deps, "settlements.read");
    return this.deps.settlementRepository.listSettlementRuns({
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.from ? { from: filters.from } : {}),
      ...(filters.to ? { to: filters.to } : {}),
      ...(filters.cursor ? { cursor: filters.cursor } : {}),
      limit: filters.limit,
    });
  }

  async getSettlementRunDetails(runId: string): Promise<SettlementRunDetailsView> {
    await requireAdminActor(this.deps, "settlements.read");

    const run = await this.deps.settlementRepository.findSettlementRunById(runId);
    if (!run) {
      throw new AppError({ code: "NOT_FOUND", message: "Settlement run was not found." });
    }

    const items = await this.deps.settlementRepository.listSettlementItemsByRunId(runId);
    return { run, items };
  }

  async getMonitoringSnapshot(): Promise<MonitoringSnapshotView> {
    await requireAdminActor(this.deps, "monitoring.read");

    const [
      pendingDeposits,
      pendingWithdrawals,
      underReviewWithdrawals,
      failedProviderEvents,
      deadLetteredProviderEvents,
      failedBackgroundJobs,
      retryableProviderEvents,
    ] = await Promise.all([
      this.deps.paymentRepository.countDepositIntentsByStatus("pending"),
      this.deps.paymentRepository.countWithdrawalsByStatus("approved"),
      this.deps.paymentRepository.countWithdrawalsByStatus("under_review"),
      this.deps.paymentRepository.countProviderEvents({ status: "failed" }),
      this.deps.paymentRepository.countProviderEvents({ deadLetteredOnly: true }),
      this.deps.operationsRepository.countBackgroundJobsByStatus("failed"),
      this.deps.paymentRepository.listRetryableProviderEvents(200),
    ]);

    return {
      pendingDeposits,
      pendingWithdrawals,
      underReviewWithdrawals,
      failedProviderEvents,
      deadLetteredProviderEvents,
      failedBackgroundJobs,
      retryableProviderEvents: retryableProviderEvents.length,
    };
  }

  async listFailedProviderEvents(limit = 50): Promise<PaymentProviderEventRecord[]> {
    await requireAdminActor(this.deps, "monitoring.read");
    const result = await this.deps.paymentRepository.listProviderEvents({ status: "failed", limit });
    return result.rows;
  }

  async listDeadLetteredProviderEvents(limit = 50): Promise<PaymentProviderEventRecord[]> {
    await requireAdminActor(this.deps, "monitoring.read");
    const result = await this.deps.paymentRepository.listProviderEvents({
      deadLetteredOnly: true,
      limit,
    });
    return result.rows;
  }

  async listRetryableProviderEvents(limit = 50): Promise<PaymentProviderEventRecord[]> {
    await requireAdminActor(this.deps, "monitoring.read");
    return this.deps.paymentRepository.listRetryableProviderEvents(limit);
  }

  async listProviderEvents(filters: ListProviderEventsInput) {
    await requireAdminActor(this.deps, "monitoring.read");
    return this.deps.paymentRepository.listProviderEvents({
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.deadLettered !== undefined ? { deadLetteredOnly: filters.deadLettered } : {}),
      ...(filters.cursor ? { cursor: filters.cursor } : {}),
      limit: filters.limit,
    });
  }

  async listFailedBackgroundJobs(limit = 50): Promise<BackgroundJobRecord[]> {
    await requireAdminActor(this.deps, "monitoring.read");
    const result = await this.deps.operationsRepository.listBackgroundJobs({
      status: "failed",
      limit,
    });
    return result.rows;
  }

  async listBackgroundJobs(filters: ListBackgroundJobsInput) {
    await requireAdminActor(this.deps, "monitoring.read");
    return this.deps.operationsRepository.listBackgroundJobs({
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.jobType ? { jobType: filters.jobType } : {}),
      ...(filters.cursor ? { cursor: filters.cursor } : {}),
      limit: filters.limit,
    });
  }

  async getOverviewMetrics(): Promise<OverviewMetricsView> {
    await requireAdminActor(this.deps, "overview.read");

    const now = this.deps.clock.now();
    const startOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    const [
      pendingDeposits,
      pendingWithdrawals,
      underReviewWithdrawals,
      depositsToday,
      withdrawalsToday,
      failedJobs,
      failedWebhooks,
      deadLetteredWebhooks,
      recentActivity,
    ] = await Promise.all([
      this.deps.paymentRepository.countDepositIntentsByStatus("pending"),
      this.deps.paymentRepository.countWithdrawalsByStatus("approved"),
      this.deps.paymentRepository.countWithdrawalsByStatus("under_review"),
      this.deps.paymentRepository.countDepositsCreatedSince(startOfDay),
      this.deps.paymentRepository.countWithdrawalsCreatedSince(startOfDay),
      this.deps.operationsRepository.countBackgroundJobsByStatus("failed"),
      this.deps.paymentRepository.countProviderEvents({ status: "failed" }),
      this.deps.paymentRepository.countProviderEvents({ deadLetteredOnly: true }),
      this.deps.operationsRepository.listRecentFinancialAuditLogs(20),
    ]);

    return {
      pendingDeposits,
      pendingWithdrawals,
      underReviewWithdrawals,
      depositsToday,
      withdrawalsToday,
      pendingReviews: pendingDeposits + underReviewWithdrawals,
      failedJobs,
      failedWebhooks,
      deadLetteredWebhooks,
      recentActivity,
    };
  }
}

export { createAdminAuditContext };
export type { RequestAuditContext };

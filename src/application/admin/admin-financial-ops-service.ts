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

import { InvestmentEngineService } from "@/application/investments/investment-engine-service";

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
  referralRepository?: import("@/infrastructure/database").ReferralRepository;
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
  customer: {
    userId: string;
    email: string | null;
    legalName: string | null;
    displayName: string | null;
    accountNumber: string | null;
  };
}

export interface WithdrawalDetailsView {
  withdrawal: WithdrawalRequestRecord;
  providerEvents: PaymentProviderEventRecord[];
  notes: AdminEntityNoteRecord[];
  customer: {
    userId: string;
    email: string | null;
    legalName: string | null;
    displayName: string | null;
    accountNumber: string | null;
  };
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
      throw new AppError({ code: "NOT_FOUND", message: "Deposit was not found." });
    }

    const [providerEvents, notes, customer] = await Promise.all([
      this.deps.paymentRepository.findProviderEventsRelatedToReference(deposit.providerIntentId),
      this.deps.operationsRepository.listAdminEntityNotes("deposit_intent", depositId, 20),
      this.loadCustomerSummary(deposit.userId),
    ]);

    return { deposit, providerEvents, notes, customer };
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
      throw new AppError({ code: "NOT_FOUND", message: "Withdrawal was not found." });
    }

    const [providerEvents, notes, customer] = await Promise.all([
      withdrawal.providerPayoutReference
        ? this.deps.paymentRepository.findProviderEventsRelatedToReference(
            withdrawal.providerPayoutReference,
          )
        : Promise.resolve([] as PaymentProviderEventRecord[]),
      this.deps.operationsRepository.listAdminEntityNotes("withdrawal_request", withdrawalId, 20),
      this.loadCustomerSummary(withdrawal.userId),
    ]);

    return { withdrawal, providerEvents, notes, customer };
  }

  private async loadCustomerSummary(userId: string) {
    const [user, profile, account] = await Promise.all([
      this.deps.identityRepository.findUserById(userId),
      this.deps.coreRepository.findCustomerProfileByUserId(userId),
      this.deps.coreRepository.findCustomerAccountByUserId(userId),
    ]);
    return {
      userId,
      email: user?.email ?? null,
      legalName: profile?.legalName ?? null,
      displayName: profile?.displayName ?? null,
      accountNumber: account?.accountNumber ?? null,
    };
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

  async completeWithdrawal(
    withdrawalId: string,
    _reason: string,
    context: RequestAuditContext,
  ): Promise<AdminWithdrawalActionResult> {
    await requireAdminActor(this.deps, "withdrawals.approve");
    return this.deps.withdrawalEngine.markWithdrawalPaid({
      withdrawalId,
      providerPayoutReference: `MANUAL-${withdrawalId.slice(0, 8)}-${Date.now()}`,
      context,
    });
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

  async listActivePlans() {
    await requireAdminActor(this.deps, "investments.read");
    return this.deps.coreRepository.listActivePublishedPlanVersions();
  }

  async listInvestmentPlans() {
    await requireAdminActor(this.deps, "investments.read");
    const rows = await this.deps.coreRepository.listAllPlanVersions();
    return {
      plans: rows.map(({ plan, version }) => ({
        planId: plan.id,
        planVersionId: version.id,
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        planStatus: plan.status,
        version: version.version,
        versionStatus: version.status,
        currency: version.currency,
        minPrincipalMinor: version.minPrincipalMinor.toString(),
        maxPrincipalMinor: version.maxPrincipalMinor.toString(),
        termDays: version.termDays,
        dailyRoiBps: version.dailyRoiBps,
        totalRoiBps: version.totalRoiBps,
        earlyExitPolicy: version.earlyExitPolicy,
        earlyExitPenaltyBps:
          typeof version.metadata?.earlyExitPenaltyBps === "number"
            ? version.metadata.earlyExitPenaltyBps
            : 0,
        effectiveFrom: version.effectiveFrom.toISOString(),
        effectiveTo: version.effectiveTo?.toISOString() ?? null,
      })),
    };
  }

  async createInvestmentPlan(
    input: {
      slug: string;
      name: string;
      description: string | null;
      currency: string;
      minPrincipalMinor: string;
      maxPrincipalMinor: string;
      termDays: number;
      dailyRoiBps: number;
      totalRoiBps: number | null;
      earlyExitPolicy: "not_allowed" | "admin_review" | "allowed_with_penalty";
      earlyExitPenaltyBps: number;
    },
    context: RequestAuditContext,
  ) {
    const admin = await requireAdminActor(this.deps, "investments.update");
    const slug = input.slug.trim().toLowerCase();
    if (!slug || !input.name.trim()) {
      throw new AppError({ code: "VALIDATION_ERROR", message: "Slug and name are required." });
    }
    if (!Number.isInteger(input.termDays) || input.termDays <= 0) {
      throw new AppError({ code: "VALIDATION_ERROR", message: "termDays must be positive." });
    }
    if (!Number.isInteger(input.dailyRoiBps) || input.dailyRoiBps < 0) {
      throw new AppError({ code: "VALIDATION_ERROR", message: "dailyRoiBps is invalid." });
    }

    const result = await this.deps.transactionManager.runInTransaction(async (tx) => {
      const plan = await this.deps.coreRepository.createInvestmentPlan(tx, {
        slug,
        name: input.name.trim(),
        description: input.description,
        status: "active",
      });
      const version = await this.deps.coreRepository.createInvestmentPlanVersion(tx, {
        planId: plan.id,
        version: 1,
        currency: input.currency.toUpperCase(),
        minPrincipalMinor: BigInt(input.minPrincipalMinor),
        maxPrincipalMinor: BigInt(input.maxPrincipalMinor),
        termDays: input.termDays,
        dailyRoiBps: input.dailyRoiBps,
        totalRoiBps: input.totalRoiBps,
        principalReturnPolicy: "return_at_maturity",
        earlyExitPolicy: input.earlyExitPolicy,
        effectiveFrom: this.deps.clock.now(),
        status: "active",
        metadata: {
          slug,
          earlyExitPenaltyBps: input.earlyExitPenaltyBps,
          earlyExitEnabled: input.earlyExitPolicy === "allowed_with_penalty",
        },
        createdBy: admin.appUser.id,
      });

      await this.deps.operationsRepository.appendAuditLog(tx, {
        actorUserId: admin.appUser.id,
        actorType: "admin",
        action: "investment_plan.created",
        targetType: "investment_plan",
        targetId: plan.id,
        reason: "Administrative package creation",
        metadata: { planVersionId: version.id, slug },
        requestId: context.requestId,
        ipAddressHash: context.ipAddressHash,
        userAgentHash: context.userAgentHash,
      });

      return { plan, version };
    });

    return {
      planId: result.plan.id,
      planVersionId: result.version.id,
      slug: result.plan.slug,
      name: result.plan.name,
    };
  }

  async updateInvestmentPlanVersion(
    planVersionId: string,
    input: {
      status?: "draft" | "active" | "retired";
      planStatus?: "draft" | "active" | "retired";
      minPrincipalMinor?: string;
      maxPrincipalMinor?: string;
      termDays?: number;
      dailyRoiBps?: number;
      totalRoiBps?: number | null;
      earlyExitPolicy?: "not_allowed" | "admin_review" | "allowed_with_penalty";
      earlyExitPenaltyBps?: number;
    },
    context: RequestAuditContext,
  ) {
    const admin = await requireAdminActor(this.deps, "investments.update");
    const version = await this.deps.coreRepository.findInvestmentPlanVersionById(planVersionId);
    if (!version) {
      throw new AppError({ code: "NOT_FOUND", message: "Plan version was not found." });
    }

    const updated = await this.deps.transactionManager.runInTransaction(async (tx) => {
      if (input.planStatus) {
        await this.deps.coreRepository.updateInvestmentPlanStatus(
          tx,
          version.planId,
          input.planStatus,
        );
      }

      const nextMetadata = {
        ...version.metadata,
        ...(input.earlyExitPenaltyBps !== undefined
          ? { earlyExitPenaltyBps: input.earlyExitPenaltyBps }
          : {}),
        ...(input.earlyExitPolicy
          ? { earlyExitEnabled: input.earlyExitPolicy === "allowed_with_penalty" }
          : {}),
      };

      const next = await this.deps.coreRepository.updateInvestmentPlanVersionTerms(
        tx,
        planVersionId,
        {
          ...(input.status ? { status: input.status } : {}),
          ...(input.minPrincipalMinor !== undefined
            ? { minPrincipalMinor: BigInt(input.minPrincipalMinor) }
            : {}),
          ...(input.maxPrincipalMinor !== undefined
            ? { maxPrincipalMinor: BigInt(input.maxPrincipalMinor) }
            : {}),
          ...(input.termDays !== undefined ? { termDays: input.termDays } : {}),
          ...(input.dailyRoiBps !== undefined ? { dailyRoiBps: input.dailyRoiBps } : {}),
          ...(input.totalRoiBps !== undefined ? { totalRoiBps: input.totalRoiBps } : {}),
          ...(input.earlyExitPolicy ? { earlyExitPolicy: input.earlyExitPolicy } : {}),
          metadata: nextMetadata,
        },
      );

      await this.deps.operationsRepository.appendAuditLog(tx, {
        actorUserId: admin.appUser.id,
        actorType: "admin",
        action: "investment_plan.updated",
        targetType: "investment_plan_version",
        targetId: planVersionId,
        reason: "Administrative package update",
        metadata: { input },
        requestId: context.requestId,
        ipAddressHash: context.ipAddressHash,
        userAgentHash: context.userAgentHash,
      });

      return next;
    });

    return {
      planVersionId: updated.id,
      status: updated.status,
      earlyExitPolicy: updated.earlyExitPolicy,
    };
  }

  async createInvestmentForCustomer(
    input: {
      userId: string;
      planVersionId: string;
      principalMinor: string;
      fundShortfall?: boolean;
      idempotencyKey?: string;
    },
    context: RequestAuditContext,
  ) {
    const admin = await requireAdminActor(this.deps, "investments.update");
    const principalMinor = BigInt(input.principalMinor);
    if (principalMinor <= 0n) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Principal must be greater than zero.",
      });
    }

    const user = await this.deps.identityRepository.findUserById(input.userId);
    if (!user) {
      throw new AppError({ code: "NOT_FOUND", message: "Customer was not found." });
    }

    const planVersion = await this.deps.coreRepository.findInvestmentPlanVersionById(
      input.planVersionId,
    );
    if (!planVersion) {
      throw new AppError({ code: "NOT_FOUND", message: "Investment plan version was not found." });
    }

    const currency = planVersion.currency;
    const fundShortfall = input.fundShortfall !== false;
    const idempotencyKey =
      input.idempotencyKey?.trim() ||
      `admin.investment:${input.userId}:${input.planVersionId}:${input.principalMinor}:${Date.now()}`;

    if (fundShortfall) {
      const balance = await this.deps.ledgerRepository.findWalletBalanceByUserCurrency(
        input.userId,
        currency,
      );
      const available = balance ? BigInt(String(balance.availableBalanceMinor)) : 0n;
      if (available < principalMinor) {
        const shortfall = principalMinor - available;
        await this.creditCustomerAvailable(
          input.userId,
          shortfall,
          currency,
          admin.appUser.id,
          context,
        );
      }
    }

    const { InvestmentEngineService } =
      await import("@/application/investments/investment-engine-service");
    const engine = new InvestmentEngineService({
      clock: this.deps.clock,
      transactionManager: this.deps.transactionManager,
      coreRepository: this.deps.coreRepository,
      investmentRepository: this.deps.investmentRepository,
      ledgerRepository: this.deps.ledgerRepository,
      settlementRepository: this.deps.settlementRepository,
      notificationRepository: this.deps.notificationRepository,
      identityRepository: this.deps.identityRepository,
      ...(this.deps.referralRepository ? { referralRepository: this.deps.referralRepository } : {}),
    });

    const result = await engine.activateInvestment({
      userId: input.userId,
      planVersionId: input.planVersionId,
      principalMinor,
      idempotencyKey,
    });

    await this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.deps.operationsRepository.appendAuditLog(tx, {
        actorUserId: admin.appUser.id,
        actorType: "admin",
        action: "investment.admin_created",
        targetType: "investment",
        targetId: result.investment.id,
        reason: "Administrative investment creation",
        metadata: {
          userId: input.userId,
          planVersionId: input.planVersionId,
          principalMinor: input.principalMinor,
          status: result.investment.status,
        },
        requestId: context.requestId,
        ipAddressHash: context.ipAddressHash,
        userAgentHash: context.userAgentHash,
      });
    });

    return result;
  }

  async updateInvestment(
    investmentId: string,
    input: { status?: "cancelled"; reason?: string },
    context: RequestAuditContext,
  ) {
    const admin = await requireAdminActor(this.deps, "investments.update");
    const investment = await this.deps.investmentRepository.findInvestmentById(investmentId);
    if (!investment) {
      throw new AppError({ code: "NOT_FOUND", message: "Investment was not found." });
    }

    if (input.status !== "cancelled") {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Only cancellation is supported for investment updates.",
      });
    }

    if (investment.status === "cancelled" || investment.status === "matured") {
      throw new AppError({
        code: "INVALID_STATE",
        message: `Investment is already ${investment.status}.`,
      });
    }

    if (investment.status === "active" || investment.status === "maturing") {
      const engine = new InvestmentEngineService({
        clock: this.deps.clock,
        transactionManager: this.deps.transactionManager,
        coreRepository: this.deps.coreRepository,
        investmentRepository: this.deps.investmentRepository,
        ledgerRepository: this.deps.ledgerRepository,
        settlementRepository: this.deps.settlementRepository,
        notificationRepository: this.deps.notificationRepository,
        identityRepository: this.deps.identityRepository,
        ...(this.deps.referralRepository
          ? { referralRepository: this.deps.referralRepository }
          : {}),
      });

      const result = await engine.stopInvestment({
        investmentId,
        force: true,
        actorUserId: admin.appUser.id,
        reason: input.reason ?? "Administrative force stop",
      });

      await this.deps.transactionManager.runInTransaction(async (tx) => {
        await this.deps.operationsRepository.appendAuditLog(tx, {
          actorUserId: admin.appUser.id,
          actorType: "admin",
          action: "investment.admin_cancelled",
          targetType: "investment",
          targetId: investment.id,
          reason: input.reason ?? "Administrative force stop",
          metadata: {
            beforeStatus: investment.status,
            afterStatus: result.investment.status,
            creditRoiMinor: result.creditRoiMinor.toString(),
            penaltyMinor: result.penaltyMinor.toString(),
            force: true,
          },
          requestId: context.requestId,
          ipAddressHash: context.ipAddressHash,
          userAgentHash: context.userAgentHash,
        });
      });

      return result.investment;
    }

    const updated = await this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.deps.investmentRepository.lockInvestmentById(tx, investmentId);

      const cancelled = await this.deps.investmentRepository.markInvestmentCancelled(
        tx,
        investment.id,
        this.deps.clock.now(),
      );

      await this.deps.operationsRepository.appendAuditLog(tx, {
        actorUserId: admin.appUser.id,
        actorType: "admin",
        action: "investment.admin_cancelled",
        targetType: "investment",
        targetId: investment.id,
        reason: input.reason ?? "Administrative cancellation",
        metadata: {
          beforeStatus: investment.status,
          afterStatus: cancelled.status,
        },
        requestId: context.requestId,
        ipAddressHash: context.ipAddressHash,
        userAgentHash: context.userAgentHash,
      });

      return cancelled;
    });

    return updated;
  }

  private async creditCustomerAvailable(
    userId: string,
    amountMinor: bigint,
    currency: string,
    adminUserId: string,
    context: RequestAuditContext,
  ) {
    await this.deps.transactionManager.runInTransaction(async (tx) => {
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
      const platformCash = await this.deps.ledgerRepository.ensureLedgerAccount(tx, {
        ownerType: "platform",
        ownerId: "unique_sky_way",
        accountType: "platform_cash",
        currency,
        status: "active",
      });
      await this.deps.ledgerRepository.postLedgerTransaction(tx, {
        transaction: {
          transactionType: "ledger_correction",
          idempotencyKey: `admin.fund_for_investment:${userId}:${amountMinor}:${Date.now()}`,
          referenceType: "user",
          referenceId: userId,
          description: "Admin funding for investment activation",
          createdBy: adminUserId,
          metadata: { fundedBy: adminUserId, requestId: context.requestId },
        },
        entries: [
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
        ],
      });
    });
  }

  async listSettlementRuns(
    filters: ListSettlementRunsInput,
  ): Promise<ListSettlementRunsResultView> {
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
    const result = await this.deps.paymentRepository.listProviderEvents({
      status: "failed",
      limit,
    });
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

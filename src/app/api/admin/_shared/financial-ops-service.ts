import type { RequestSecurityContext } from "@/application/auth/security";
import { AdminFinancialOpsService, createAdminAuditContext } from "@/application/admin";
import { DepositEngineService, WithdrawalEngineService } from "@/application/payments";
import type {
  AdminEntityNoteRecord,
  AuditLogRecord,
  BackgroundJobRecord,
  InvestmentRecord,
  PaymentProviderEventRecord,
  RoiScheduleItemRecord,
  SettlementItemRecord,
  SettlementRunRecord,
} from "@/infrastructure/database";
import {
  CoreRepository,
  DrizzleTransactionManager,
  IdentityRepository,
  InvestmentRepository,
  LedgerRepository,
  NotificationRepository,
  OperationsRepository,
  PaymentRepository,
  ReferralRepository,
  SettlementRepository,
  getDatabaseConnection,
} from "@/infrastructure/database";
import {
  SupabaseIdentityProvider,
  createSupabaseAdminAuthClient,
  createSupabaseRouteClient,
} from "@/infrastructure/auth";
import { createPaystackPaymentProvider } from "@/infrastructure/payments";
import { systemClock } from "@/infrastructure/time/system-clock";

export async function createAdminFinancialOpsService() {
  const { db } = getDatabaseConnection();
  const identityProvider = new SupabaseIdentityProvider(
    createSupabaseAdminAuthClient(),
    await createSupabaseRouteClient(),
  );

  const identityRepository = new IdentityRepository(db);
  const coreRepository = new CoreRepository(db);
  const paymentRepository = new PaymentRepository(db);
  const ledgerRepository = new LedgerRepository(db);
  const notificationRepository = new NotificationRepository(db);
  const operationsRepository = new OperationsRepository(db);
  const investmentRepository = new InvestmentRepository(db);
  const settlementRepository = new SettlementRepository(db);
  const referralRepository = new ReferralRepository(db);
  const transactionManager = new DrizzleTransactionManager(db);
  const paymentProvider = createPaystackPaymentProvider();

  const depositEngine = new DepositEngineService({
    identityProvider,
    clock: systemClock,
    transactionManager,
    identityRepository,
    coreRepository,
    paymentRepository,
    ledgerRepository,
    notificationRepository,
    operationsRepository,
    paymentProvider,
  });

  const withdrawalEngine = new WithdrawalEngineService({
    identityProvider,
    clock: systemClock,
    transactionManager,
    identityRepository,
    coreRepository,
    paymentRepository,
    ledgerRepository,
    notificationRepository,
    operationsRepository,
    paymentProvider,
  });

  return new AdminFinancialOpsService({
    identityProvider,
    clock: systemClock,
    transactionManager,
    identityRepository,
    coreRepository,
    paymentRepository,
    ledgerRepository,
    investmentRepository,
    settlementRepository,
    operationsRepository,
    notificationRepository,
    depositEngine,
    withdrawalEngine,
    referralRepository,
  });
}

export function createAdminFinancialOpsAuditContext(context: RequestSecurityContext) {
  return createAdminAuditContext(context);
}

export function serializeAdminEntityNote(note: AdminEntityNoteRecord) {
  return {
    id: note.id,
    targetType: note.targetType,
    targetId: note.targetId,
    authorUserId: note.authorUserId,
    body: note.body,
    createdAt: note.createdAt.toISOString(),
  };
}

export function serializeAdminFinancialAuditLog(log: AuditLogRecord) {
  return {
    id: log.id,
    actorUserId: log.actorUserId,
    actorType: log.actorType,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    reason: log.reason,
    metadata: log.metadata,
    requestId: log.requestId,
    createdAt: log.createdAt.toISOString(),
  };
}

export function serializeAdminProviderEvent(event: PaymentProviderEventRecord) {
  return {
    id: event.id,
    provider: event.provider,
    providerEventId: event.providerEventId,
    eventType: event.eventType,
    status: event.status,
    attemptCount: event.attemptCount,
    nextRetryAt: event.nextRetryAt?.toISOString() ?? null,
    deadLetteredAt: event.deadLetteredAt?.toISOString() ?? null,
    receivedAt: event.receivedAt.toISOString(),
    processedAt: event.processedAt?.toISOString() ?? null,
    errorMessage: event.errorMessage,
  };
}

export function serializeAdminBackgroundJob(job: BackgroundJobRecord) {
  return {
    id: job.id,
    jobType: job.jobType,
    status: job.status,
    attemptCount: job.attemptCount,
    maxAttempts: job.maxAttempts,
    runAt: job.runAt.toISOString(),
    lastError: job.lastError,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

export function serializeAdminInvestment(investment: InvestmentRecord) {
  return {
    id: investment.id,
    userId: investment.userId,
    currency: investment.currency,
    principalMinor: investment.principalMinor.toString(),
    dailyRoiBps: investment.dailyRoiBps,
    totalRoiBps: investment.totalRoiBps,
    promisedRoiMinor: investment.promisedRoiMinor?.toString() ?? null,
    termDays: investment.termDays,
    status: investment.status,
    startAt: investment.startAt?.toISOString() ?? null,
    firstSettlementDate: investment.firstSettlementDate,
    maturityDate: investment.maturityDate,
    createdAt: investment.createdAt.toISOString(),
    activatedAt: investment.activatedAt?.toISOString() ?? null,
    maturedAt: investment.maturedAt?.toISOString() ?? null,
    cancelledAt: investment.cancelledAt?.toISOString() ?? null,
  };
}

export function serializeAdminRoiScheduleItem(item: RoiScheduleItemRecord) {
  return {
    id: item.id,
    investmentId: item.investmentId,
    sequenceNumber: item.sequenceNumber,
    earningDate: item.earningDate,
    settlementDate: item.settlementDate,
    expectedRoiMicroMinor: item.expectedRoiMicroMinor.toString(),
    status: item.status,
    postedAt: item.postedAt?.toISOString() ?? null,
  };
}

export function serializeAdminSettlementRun(run: SettlementRunRecord) {
  return {
    id: run.id,
    settlementDate: run.settlementDate,
    runType: run.runType,
    status: run.status,
    startedAt: run.startedAt?.toISOString() ?? null,
    completedAt: run.completedAt?.toISOString() ?? null,
    errorMessage: run.errorMessage,
    createdAt: run.createdAt.toISOString(),
  };
}

export function serializeAdminSettlementItem(item: SettlementItemRecord) {
  return {
    id: item.id,
    settlementRunId: item.settlementRunId,
    investmentId: item.investmentId,
    earningDate: item.earningDate,
    settlementDate: item.settlementDate,
    grossRoiMicroMinor: item.grossRoiMicroMinor.toString(),
    postedRoiMinor: item.postedRoiMinor.toString(),
    status: item.status,
    reason: item.reason,
    createdAt: item.createdAt.toISOString(),
  };
}

import type { RequestSecurityContext } from "@/application/auth/security";
import {
  DepositEngineService,
  WithdrawalEngineService,
  createPaymentAuditContext,
} from "@/application/payments";
import type { DepositIntentRecord, WithdrawalRequestRecord } from "@/infrastructure/database";
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
import { systemClock } from "@/infrastructure/time/system-clock";

export interface CreateDepositEngineServiceOptions {
  withIdentity?: boolean;
}

export async function createDepositEngineService(options: CreateDepositEngineServiceOptions = {}) {
  const { db } = getDatabaseConnection();
  const identityProvider = options.withIdentity
    ? new SupabaseIdentityProvider(
        createSupabaseAdminAuthClient(),
        await createSupabaseRouteClient(),
      )
    : undefined;

  return new DepositEngineService({
    ...(identityProvider ? { identityProvider } : {}),
    clock: systemClock,
    transactionManager: new DrizzleTransactionManager(db),
    identityRepository: new IdentityRepository(db),
    coreRepository: new CoreRepository(db),
    paymentRepository: new PaymentRepository(db),
    ledgerRepository: new LedgerRepository(db),
    notificationRepository: new NotificationRepository(db),
    operationsRepository: new OperationsRepository(db),
    investmentRepository: new InvestmentRepository(db),
    settlementRepository: new SettlementRepository(db),
    referralRepository: new ReferralRepository(db),
  });
}

export async function createWithdrawalEngineService(
  options: CreateDepositEngineServiceOptions = {},
) {
  const { db } = getDatabaseConnection();
  const identityProvider = options.withIdentity
    ? new SupabaseIdentityProvider(
        createSupabaseAdminAuthClient(),
        await createSupabaseRouteClient(),
      )
    : undefined;

  return new WithdrawalEngineService({
    ...(identityProvider ? { identityProvider } : {}),
    clock: systemClock,
    transactionManager: new DrizzleTransactionManager(db),
    identityRepository: new IdentityRepository(db),
    coreRepository: new CoreRepository(db),
    paymentRepository: new PaymentRepository(db),
    ledgerRepository: new LedgerRepository(db),
    notificationRepository: new NotificationRepository(db),
    operationsRepository: new OperationsRepository(db),
  });
}

export function createPaymentRouteAuditContext(context: RequestSecurityContext) {
  return createPaymentAuditContext(context);
}

export function serializeDepositIntent(deposit: DepositIntentRecord) {
  const metadata = deposit.providerMetadata ?? {};
  const evidenceUrl = typeof metadata.evidenceUrl === "string" ? metadata.evidenceUrl : null;
  const walletAddress = typeof metadata.address === "string" ? metadata.address : null;
  const autoInvestRaw =
    metadata.autoInvest && typeof metadata.autoInvest === "object"
      ? (metadata.autoInvest as Record<string, unknown>)
      : null;
  const autoInvest = autoInvestRaw
    ? {
        investmentId:
          typeof autoInvestRaw.investmentId === "string" ? autoInvestRaw.investmentId : null,
        planSlug: typeof autoInvestRaw.planSlug === "string" ? autoInvestRaw.planSlug : null,
        planName: typeof autoInvestRaw.planName === "string" ? autoInvestRaw.planName : null,
        status: typeof autoInvestRaw.status === "string" ? autoInvestRaw.status : "AUTO_INVESTED",
      }
    : null;

  return {
    id: deposit.id,
    provider: deposit.provider,
    providerIntentId: deposit.providerIntentId,
    currency: deposit.currency,
    amountMinor: deposit.amountMinor.toString(),
    status: deposit.status,
    fundingAsset: deposit.fundingAsset,
    fundingNetwork: deposit.fundingNetwork,
    transactionHash: deposit.transactionHash,
    customerNote: deposit.customerNote,
    evidenceUrl,
    walletAddress,
    providerAuthorizationUrl: deposit.providerAuthorizationUrl,
    confirmationLedgerTransactionId: deposit.confirmationLedgerTransactionId,
    autoInvest,
    createdAt: deposit.createdAt.toISOString(),
    confirmedAt: deposit.confirmedAt?.toISOString() ?? null,
    updatedAt: deposit.updatedAt.toISOString(),
  };
}

export function serializeDepositProviderAction() {
  return null;
}

export function serializeWithdrawalRequest(withdrawal: WithdrawalRequestRecord) {
  return {
    id: withdrawal.id,
    currency: withdrawal.currency,
    amountMinor: withdrawal.amountMinor.toString(),
    destinationType: withdrawal.destinationType,
    destinationReference: withdrawal.destinationReference,
    status: withdrawal.status,
    reviewReason: withdrawal.reviewReason,
    provider: withdrawal.provider,
    providerPayoutReference: withdrawal.providerPayoutReference,
    reservationLedgerTransactionId: withdrawal.reservationLedgerTransactionId,
    paymentLedgerTransactionId: withdrawal.paymentLedgerTransactionId,
    releaseLedgerTransactionId: withdrawal.releaseLedgerTransactionId,
    payoutInitiatedAt: withdrawal.payoutInitiatedAt?.toISOString() ?? null,
    paidAt: withdrawal.paidAt?.toISOString() ?? null,
    createdAt: withdrawal.createdAt.toISOString(),
    updatedAt: withdrawal.updatedAt.toISOString(),
  };
}

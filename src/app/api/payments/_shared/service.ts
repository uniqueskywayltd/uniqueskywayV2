import type { RequestSecurityContext } from "@/application/auth/security";
import {
  DepositEngineService,
  WithdrawalEngineService,
  createPaymentAuditContext,
  type DepositProviderAction,
} from "@/application/payments";
import type { DepositIntentRecord, WithdrawalRequestRecord } from "@/infrastructure/database";
import {
  CoreRepository,
  DrizzleTransactionManager,
  IdentityRepository,
  LedgerRepository,
  NotificationRepository,
  OperationsRepository,
  PaymentRepository,
  getDatabaseConnection,
} from "@/infrastructure/database";
import {
  SupabaseIdentityProvider,
  createSupabaseAdminAuthClient,
  createSupabaseRouteClient,
} from "@/infrastructure/auth";
import { createPaystackPaymentProvider } from "@/infrastructure/payments";
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
    paymentProvider: createPaystackPaymentProvider(),
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
    paymentProvider: createPaystackPaymentProvider(),
  });
}

export function createPaymentRouteAuditContext(context: RequestSecurityContext) {
  return createPaymentAuditContext(context);
}

export function serializeDepositIntent(deposit: DepositIntentRecord) {
  return {
    id: deposit.id,
    provider: deposit.provider,
    providerIntentId: deposit.providerIntentId,
    currency: deposit.currency,
    amountMinor: deposit.amountMinor.toString(),
    status: deposit.status,
    providerAuthorizationUrl: deposit.providerAuthorizationUrl,
    confirmationLedgerTransactionId: deposit.confirmationLedgerTransactionId,
    createdAt: deposit.createdAt.toISOString(),
    confirmedAt: deposit.confirmedAt?.toISOString() ?? null,
    updatedAt: deposit.updatedAt.toISOString(),
  };
}

export function serializeDepositProviderAction(action: DepositProviderAction | null) {
  if (!action) return null;

  return {
    provider: action.provider,
    authorizationUrl: action.authorizationUrl,
    accessCode: action.accessCode,
    reference: action.reference,
  };
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

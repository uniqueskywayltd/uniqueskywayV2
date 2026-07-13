import type { RequestSecurityContext } from "@/application/auth/security";
import { AdminCustomerService, createAdminAuditContext } from "@/application/admin";
import type {
  AuditLogRecord,
  CustomerAccountRecord,
  CustomerNoteRecord,
  CustomerProfileRecord,
  CustomerSearchRow,
  UserRecord,
} from "@/infrastructure/database";
import {
  CoreRepository,
  DrizzleTransactionManager,
  IdentityRepository,
  OperationsRepository,
  getDatabaseConnection,
} from "@/infrastructure/database";
import {
  SupabaseIdentityProvider,
  createSupabaseAdminAuthClient,
  createSupabaseRouteClient,
} from "@/infrastructure/auth";

export async function createAdminCustomerService() {
  const { db } = getDatabaseConnection();
  const identityProvider = new SupabaseIdentityProvider(
    createSupabaseAdminAuthClient(),
    await createSupabaseRouteClient(),
  );

  return new AdminCustomerService({
    identityProvider,
    transactionManager: new DrizzleTransactionManager(db),
    identityRepository: new IdentityRepository(db),
    coreRepository: new CoreRepository(db),
    operationsRepository: new OperationsRepository(db),
  });
}

export function createAdminRouteAuditContext(context: RequestSecurityContext) {
  return createAdminAuditContext(context);
}

export function serializeAdminUser(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function serializeAdminCustomerAccount(account: CustomerAccountRecord | null) {
  if (!account) return null;

  return {
    id: account.id,
    userId: account.userId,
    accountNumber: account.accountNumber,
    status: account.status,
    restrictionReason: account.restrictionReason,
    openedAt: account.openedAt.toISOString(),
    closedAt: account.closedAt?.toISOString() ?? null,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}

export function serializeAdminCustomerProfile(profile: CustomerProfileRecord | null) {
  if (!profile) return null;

  return {
    id: profile.id,
    userId: profile.userId,
    legalName: profile.legalName,
    displayName: profile.displayName,
    phone: profile.phone,
    country: profile.country,
    stateRegion: profile.stateRegion,
    dateOfBirth: profile.dateOfBirth,
    onboardingStatus: profile.onboardingStatus,
    kycStatus: profile.kycStatus,
    riskStatus: profile.riskStatus,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export function serializeAdminCustomerNote(note: CustomerNoteRecord) {
  return {
    id: note.id,
    userId: note.userId,
    authorUserId: note.authorUserId,
    body: note.body,
    createdAt: note.createdAt.toISOString(),
  };
}

export function serializeAdminCustomerSearchRow(row: CustomerSearchRow) {
  return {
    userId: row.userId,
    email: row.email,
    userStatus: row.userStatus,
    emailVerifiedAt: row.emailVerifiedAt?.toISOString() ?? null,
    userCreatedAt: row.userCreatedAt.toISOString(),
    displayName: row.displayName,
    legalName: row.legalName,
    kycStatus: row.kycStatus,
    riskStatus: row.riskStatus,
    accountNumber: row.accountNumber,
    accountStatus: row.accountStatus,
    accountRestrictionReason: row.accountRestrictionReason,
  };
}

export function serializeAdminAuditLog(log: AuditLogRecord) {
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

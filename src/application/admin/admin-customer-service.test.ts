import { describe, expect, it, vi } from "vitest";

import type { AuthenticatedUser } from "@/application/auth";

import { AdminCustomerService } from "./admin-customer-service";
import { permissionKeysForRoles } from "./test-role-permissions";

const auditContext = {
  requestId: "request_1",
  ipAddressHash: null,
  userAgentHash: null,
};

describe("AdminCustomerService", () => {
  it("rejects unauthenticated access to search", async () => {
    const fixture = createFixture({ authenticated: false });

    await expect(fixture.service.searchCustomers({ limit: 20 })).rejects.toMatchObject({
      code: "AUTHENTICATION_ERROR",
    });
  });

  it("rejects actors without an authorized role", async () => {
    const fixture = createFixture({ roleKeys: [] });

    await expect(fixture.service.searchCustomers({ limit: 20 })).rejects.toMatchObject({
      code: "AUTHORIZATION_ERROR",
    });
  });

  it("searches customers for support agents, finance admins, and platform admins", async () => {
    for (const roleKey of ["support_agent", "finance_admin", "platform_admin"]) {
      const fixture = createFixture({ roleKeys: [roleKey] });

      const result = await fixture.service.searchCustomers({
        q: "jane",
        limit: 20,
      });

      expect(result.rows).toEqual(fixture.state.searchRows);
      expect(fixture.coreRepository.searchCustomers).toHaveBeenCalledWith(
        expect.objectContaining({ q: "jane", limit: 20 }),
      );
    }
  });

  it("requires compliance_officer to restrict or close a customer account", async () => {
    const supportFixture = createFixture({ roleKeys: ["support_agent"] });

    await expect(
      supportFixture.service.updateCustomerStatus(
        "user_1",
        { status: "restricted", reason: "Suspicious activity" },
        auditContext,
      ),
    ).rejects.toMatchObject({ code: "AUTHORIZATION_ERROR" });
  });

  it("requires a reason to restrict or close a customer account", async () => {
    const fixture = createFixture({ roleKeys: ["compliance_officer"] });

    await expect(
      fixture.service.updateCustomerStatus("user_1", { status: "restricted" }, auditContext),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    expect(fixture.identityRepository.updateUserStatus).not.toHaveBeenCalled();
  });

  it("restricts a customer account with a reason and writes an admin audit log", async () => {
    const fixture = createFixture({ roleKeys: ["compliance_officer"] });

    const result = await fixture.service.updateCustomerStatus(
      "user_1",
      { status: "restricted", reason: "Suspicious withdrawal pattern" },
      auditContext,
    );

    expect(result.account?.status).toBe("restricted");
    expect(fixture.identityRepository.updateUserStatus).toHaveBeenCalledWith(
      expect.anything(),
      "user_1",
      "restricted",
    );
    expect(fixture.coreRepository.updateCustomerAccountStatus).toHaveBeenCalledWith(
      expect.anything(),
      "user_1",
      expect.objectContaining({
        status: "restricted",
        restrictionReason: "Suspicious withdrawal pattern",
      }),
    );
    expect(fixture.operationsRepository.appendAuditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        actorType: "admin",
        action: "customer.status_updated",
        targetType: "user",
        targetId: "user_1",
        reason: "Suspicious withdrawal pattern",
      }),
    );
  });

  it("allows an active customer account with no reason required", async () => {
    const fixture = createFixture({ roleKeys: ["compliance_officer"] });

    const result = await fixture.service.updateCustomerStatus(
      "user_1",
      { status: "active" },
      auditContext,
    );

    expect(result.account?.status).toBe("active");
  });

  it("requires compliance_officer for KYC review and records the reason on the audit log", async () => {
    const supportFixture = createFixture({ roleKeys: ["support_agent"] });

    await expect(
      supportFixture.service.updateCustomerVerification(
        "user_1",
        { kycStatus: "approved", reason: "Documents verified" },
        auditContext,
      ),
    ).rejects.toMatchObject({ code: "AUTHORIZATION_ERROR" });

    const fixture = createFixture({ roleKeys: ["compliance_officer"] });

    const result = await fixture.service.updateCustomerVerification(
      "user_1",
      { kycStatus: "approved", riskStatus: "clear", reason: "Documents verified" },
      auditContext,
    );

    expect(result.profile?.kycStatus).toBe("approved");
    expect(fixture.coreRepository.updateCustomerKycStatus).toHaveBeenCalledWith(
      expect.anything(),
      "user_1",
      expect.objectContaining({ kycStatus: "approved", riskStatus: "clear" }),
    );
    expect(fixture.operationsRepository.appendAuditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        action: "customer.kyc_updated",
        reason: "Documents verified",
      }),
    );
  });

  it("lets support agents and platform admins add customer notes", async () => {
    for (const roleKey of ["support_agent", "platform_admin"]) {
      const fixture = createFixture({ roleKeys: [roleKey] });

      const note = await fixture.service.addCustomerNote(
        "user_1",
        { body: "Called customer about deposit delay." },
        auditContext,
      );

      expect(note.body).toBe("Called customer about deposit delay.");
      expect(fixture.coreRepository.createCustomerNote).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: "user_1",
          body: "Called customer about deposit delay.",
        }),
      );
      expect(fixture.operationsRepository.appendAuditLog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ action: "customer.note_added", targetId: "user_1" }),
      );
    }
  });

  it("rejects finance_admin from adding a customer note", async () => {
    const fixture = createFixture({ roleKeys: ["finance_admin"] });

    await expect(
      fixture.service.addCustomerNote("user_1", { body: "Note" }, auditContext),
    ).rejects.toMatchObject({ code: "AUTHORIZATION_ERROR" });
  });

  it("returns the combined actor and target audit timeline for a customer", async () => {
    const fixture = createFixture({ roleKeys: ["support_agent"] });

    const timeline = await fixture.service.getCustomerAuditTimeline("user_1", 25);

    expect(fixture.operationsRepository.listAuditLogsForCustomerTimeline).toHaveBeenCalledWith(
      "user_1",
      25,
    );
    expect(timeline).toEqual(fixture.state.auditLogs);
  });
});

interface FixtureOptions {
  authenticated?: boolean;
  roleKeys?: string[];
}

function createFixture(options: FixtureOptions = {}) {
  const authenticated = options.authenticated ?? true;
  const roleKeys = options.roleKeys ?? ["platform_admin"];

  const currentUser: AuthenticatedUser = {
    authUserId: "00000000-0000-0000-0000-000000000099",
    email: "admin@example.com",
    emailVerifiedAt: new Date("2026-07-13T12:00:00.000Z"),
    displayName: "Admin",
  };

  const adminAppUser = {
    id: "admin_1",
    authUserId: currentUser.authUserId,
    email: "admin@example.com",
    emailVerifiedAt: currentUser.emailVerifiedAt,
    status: "active" as const,
    createdAt: new Date("2026-07-13T12:00:00.000Z"),
    updatedAt: new Date("2026-07-13T12:00:00.000Z"),
  };

  const customerAppUser = {
    id: "user_1",
    authUserId: "00000000-0000-0000-0000-000000000001",
    email: "customer@example.com",
    emailVerifiedAt: new Date("2026-07-13T12:00:00.000Z"),
    status: "active" as const,
    createdAt: new Date("2026-07-13T12:00:00.000Z"),
    updatedAt: new Date("2026-07-13T12:00:00.000Z"),
  };

  const state = {
    users: [adminAppUser, customerAppUser],
    account: {
      id: "account_1",
      userId: "user_1",
      accountNumber: "USW-0001",
      status: "active" as const,
      restrictionReason: null as string | null,
      openedAt: new Date("2026-07-13T12:00:00.000Z"),
      closedAt: null as Date | null,
      createdAt: new Date("2026-07-13T12:00:00.000Z"),
      updatedAt: new Date("2026-07-13T12:00:00.000Z"),
    },
    profile: {
      id: "profile_1",
      userId: "user_1",
      legalName: null,
      displayName: "Jane Doe",
      phone: null,
      country: null,
      stateRegion: null,
      dateOfBirth: null,
      avatarStoragePath: null,
      avatarContentType: null,
      avatarUpdatedAt: null,
      onboardingStatus: "not_started" as const,
      kycStatus: "pending" as const,
      riskStatus: "not_reviewed" as const,
      termsAcceptedAt: null,
      termsVersion: null,
      createdAt: new Date("2026-07-13T12:00:00.000Z"),
      updatedAt: new Date("2026-07-13T12:00:00.000Z"),
    },
    searchRows: [
      {
        userId: "user_1",
        email: "customer@example.com",
        userStatus: "active" as const,
        emailVerifiedAt: new Date("2026-07-13T12:00:00.000Z"),
        userCreatedAt: new Date("2026-07-13T12:00:00.000Z"),
        displayName: "Jane Doe",
        legalName: null,
        kycStatus: "pending" as const,
        riskStatus: "not_reviewed" as const,
        accountNumber: "USW-0001",
        accountStatus: "active" as const,
        accountRestrictionReason: null,
      },
    ],
    auditLogs: [
      {
        id: "audit_1",
        actorUserId: "admin_1",
        actorType: "admin" as const,
        action: "customer.note_added",
        targetType: "user",
        targetId: "user_1",
        reason: null,
        metadata: {},
        requestId: "request_0",
        ipAddressHash: null,
        userAgentHash: null,
        createdAt: new Date("2026-07-13T12:00:00.000Z"),
      },
    ],
  };

  const identityProvider = {
    getCurrentUser: vi.fn(async () => (authenticated ? currentUser : null)),
  };

  const identityRepository = {
    findUserByAuthUserId: vi.fn(
      async (authUserId: string) =>
        state.users.find((user) => user.authUserId === authUserId) ?? null,
    ),
    findUserById: vi.fn(
      async (userId: string) => state.users.find((user) => user.id === userId) ?? null,
    ),
    findAdminProfileByUserId: vi.fn(async (userId: string) =>
      userId === adminAppUser.id
        ? {
            id: "admin_profile_1",
            userId,
            status: "active" as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        : null,
    ),
    listActiveRoleKeysForUser: vi.fn(async (userId: string) =>
      userId === adminAppUser.id ? roleKeys : [],
    ),
    listActivePermissionKeysForUser: vi.fn(async (userId: string) =>
      userId === adminAppUser.id ? permissionKeysForRoles(roleKeys) : [],
    ),
    updateUserStatus: vi.fn(async (_tx: unknown, userId: string, status: string) => {
      const user = state.users.find((candidate) => candidate.id === userId);
      if (!user) throw new Error("Missing user.");
      Object.assign(user, { status });
      return user;
    }),
  };

  const coreRepository = {
    searchCustomers: vi.fn(async () => ({ rows: state.searchRows, nextCursor: null })),
    findCustomerProfileByUserId: vi.fn(async () => state.profile),
    findCustomerAccountByUserId: vi.fn(async () => state.account),
    updateCustomerAccountStatus: vi.fn(
      async (
        _tx: unknown,
        _userId: string,
        values: { status: string; restrictionReason: string | null; closedAt: Date | null },
      ) => {
        Object.assign(state.account, values);
        return state.account;
      },
    ),
    updateCustomerKycStatus: vi.fn(
      async (_tx: unknown, _userId: string, values: { kycStatus: string; riskStatus?: string }) => {
        Object.assign(state.profile, values);
        return state.profile;
      },
    ),
    createCustomerNote: vi.fn(
      async (_tx: unknown, values: { userId: string; authorUserId: string; body: string }) => ({
        id: "note_1",
        userId: values.userId,
        authorUserId: values.authorUserId,
        body: values.body,
        createdAt: new Date("2026-07-13T12:00:00.000Z"),
      }),
    ),
    listCustomerNotesByUserId: vi.fn(async () => []),
  };

  const operationsRepository = {
    appendAuditLog: vi.fn(async (_tx: unknown, values: Record<string, unknown>) => ({
      id: "audit_new",
      ...values,
      createdAt: new Date("2026-07-13T12:00:00.000Z"),
    })),
    listAuditLogsForCustomerTimeline: vi.fn(async () => state.auditLogs),
  };

  const transactionManager = {
    runInTransaction: async <TResult>(work: (tx: unknown) => Promise<TResult>) =>
      work({ db: {}, transactionId: "tx_1" }),
  };

  const service = new AdminCustomerService({
    identityProvider: identityProvider as never,
    transactionManager: transactionManager as never,
    identityRepository: identityRepository as never,
    coreRepository: coreRepository as never,
    operationsRepository: operationsRepository as never,
    ledgerRepository: {
      lockWalletByUserCurrency: vi.fn(),
      findWalletBalanceByUserCurrencyInTransaction: vi.fn(),
      findWalletAccountByCategoryInTransaction: vi.fn(),
      ensureLedgerAccount: vi.fn(),
      postLedgerTransaction: vi.fn(),
    } as never,
    notificationRepository: {
      enqueueEmail: vi.fn(async () => ({ id: "email_1" })),
    } as never,
  });

  return {
    service,
    state,
    identityProvider,
    identityRepository,
    coreRepository,
    operationsRepository,
  };
}

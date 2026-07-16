import { describe, expect, it, vi } from "vitest";

import type { AuthenticatedUser } from "@/application/auth";

import { AdminFinancialOpsService } from "./admin-financial-ops-service";
import { permissionKeysForRoles } from "./test-role-permissions";

const auditContext = {
  requestId: "request_1",
  ipAddressHash: null,
  userAgentHash: null,
};

describe("AdminFinancialOpsService", () => {
  it("rejects unauthenticated access to deposit search", async () => {
    const fixture = createFixture({ authenticated: false });

    await expect(fixture.service.searchDeposits({ limit: 20 })).rejects.toMatchObject({
      code: "AUTHENTICATION_ERROR",
    });
  });

  it("rejects actors without an authorized role from reading deposits", async () => {
    const fixture = createFixture({ roleKeys: [] });

    await expect(fixture.service.searchDeposits({ limit: 20 })).rejects.toMatchObject({
      code: "AUTHORIZATION_ERROR",
    });
  });

  it("searches deposits for support agents, finance admins, and platform admins", async () => {
    for (const roleKey of ["support_agent", "finance_admin", "platform_admin"]) {
      const fixture = createFixture({ roleKeys: [roleKey] });

      const result = await fixture.service.searchDeposits({ q: "USWDEP", limit: 20 });

      expect(result.rows).toEqual(fixture.state.deposits);
      expect(fixture.paymentRepository.searchDepositIntents).toHaveBeenCalledWith(
        expect.objectContaining({ q: "USWDEP", limit: 20 }),
      );
    }
  });

  it("delegates deposit approval to the deposit engine without duplicating ledger postings", async () => {
    const fixture = createFixture({ roleKeys: ["finance_admin"] });

    const result = await fixture.service.approveDeposit("deposit_1", "Manual review", auditContext);

    expect(fixture.depositEngine.adminApproveDeposit).toHaveBeenCalledWith(
      "deposit_1",
      "Manual review",
      auditContext,
    );
    expect(result.depositIntent.id).toBe("deposit_1");
  });

  it("rejects deposit review actions from support agents", async () => {
    const fixture = createFixture({ roleKeys: ["support_agent"] });

    await expect(
      fixture.service.approveDeposit("deposit_1", "Manual review", auditContext),
    ).rejects.toMatchObject({ code: "AUTHORIZATION_ERROR" });
    expect(fixture.depositEngine.adminApproveDeposit).not.toHaveBeenCalled();
  });

  it("delegates withdrawal rejection to the withdrawal engine", async () => {
    const fixture = createFixture({ roleKeys: ["platform_admin"] });

    const result = await fixture.service.rejectWithdrawal(
      "withdrawal_1",
      "Suspicious destination",
      auditContext,
    );

    expect(fixture.withdrawalEngine.rejectWithdrawal).toHaveBeenCalledWith(
      "withdrawal_1",
      { reason: "Suspicious destination" },
      auditContext,
    );
    expect(result.withdrawal.id).toBe("withdrawal_1");
  });

  it("delegates withdrawal payout queueing to the withdrawal engine", async () => {
    const fixture = createFixture({ roleKeys: ["finance_admin"] });

    const result = await fixture.service.queueWithdrawal("withdrawal_1", auditContext);

    expect(fixture.withdrawalEngine.queueWithdrawalPayout).toHaveBeenCalledWith(
      "withdrawal_1",
      auditContext,
    );
    expect(result.withdrawal.id).toBe("withdrawal_1");
  });

  it("returns read-only investment details without exposing mutation methods", async () => {
    const fixture = createFixture({ roleKeys: ["support_agent"] });

    const details = await fixture.service.getInvestmentDetails("investment_1");

    expect(details.investment.id).toBe("investment_1");
    expect(details.roiScheduleItems).toEqual(fixture.state.roiScheduleItems);
    expect(details.settlementItems).toEqual(fixture.state.settlementItems);
    expect(details.postedRoiMinor).toBe(5_000n);
    expect(
      (fixture.service as unknown as { getInvestmentDetails: unknown }).getInvestmentDetails,
    ).toBeTypeOf("function");
    expect(
      (fixture.service as unknown as Record<string, unknown>).updateInvestment,
    ).toBeUndefined();
  });

  it("computes overview metrics from repository counts and recent activity", async () => {
    const fixture = createFixture({ roleKeys: ["support_agent"] });

    const metrics = await fixture.service.getOverviewMetrics();

    expect(metrics).toMatchObject({
      pendingDeposits: 3,
      pendingWithdrawals: 2,
      underReviewWithdrawals: 4,
      depositsToday: 7,
      withdrawalsToday: 5,
      pendingReviews: 7,
      failedJobs: 1,
      failedWebhooks: 6,
      deadLetteredWebhooks: 2,
    });
    expect(metrics.recentActivity).toEqual(fixture.state.auditLogs);
  });

  it("requires the notes-write capability to add a deposit note and rejects read-only roles", async () => {
    const readOnlyFixture = createFixture({ roleKeys: ["support_agent"] });

    await expect(
      readOnlyFixture.service.addDepositNote(
        "deposit_1",
        { body: "Called customer." },
        auditContext,
      ),
    ).rejects.toMatchObject({ code: "AUTHORIZATION_ERROR" });

    const fixture = createFixture({ roleKeys: ["finance_admin"] });

    const note = await fixture.service.addDepositNote(
      "deposit_1",
      { body: "Called customer about delay." },
      auditContext,
    );

    expect(note.body).toBe("Called customer about delay.");
    expect(fixture.operationsRepository.createAdminEntityNote).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        targetType: "deposit_intent",
        targetId: "deposit_1",
        body: "Called customer about delay.",
      }),
    );
    expect(fixture.operationsRepository.appendAuditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: "deposit.note_added", targetId: "deposit_1" }),
    );
  });

  it("never posts ledger transactions directly from the ops service", async () => {
    const fixture = createFixture({ roleKeys: ["platform_admin"] });

    await fixture.service.approveDeposit("deposit_1", "Manual review", auditContext);
    await fixture.service.rejectWithdrawal("withdrawal_1", "Reason", auditContext);
    await fixture.service.queueWithdrawal("withdrawal_1", auditContext);
    await fixture.service.addDepositNote("deposit_1", { body: "Note" }, auditContext);
    await fixture.service.getOverviewMetrics();
    await fixture.service.getMonitoringSnapshot();

    expect(fixture.ledgerRepository.postLedgerTransaction).not.toHaveBeenCalled();
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
    mustChangePassword: false,
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

  const state = {
    deposits: [
      {
        id: "deposit_1",
        userId: "user_1",
        provider: "paystack",
        providerIntentId: "USWDEP-1",
        currency: "USD",
        amountMinor: 100_00n,
        status: "pending" as const,
        createdAt: new Date("2026-07-13T12:00:00.000Z"),
        updatedAt: new Date("2026-07-13T12:00:00.000Z"),
      },
    ],
    investment: {
      id: "investment_1",
      userId: "user_1",
      status: "active" as const,
      createdAt: new Date("2026-07-13T12:00:00.000Z"),
    },
    roiScheduleItems: [{ id: "roi_1", investmentId: "investment_1", sequenceNumber: 1 }],
    settlementItems: [{ id: "settlement_item_1", investmentId: "investment_1" }],
    auditLogs: [
      {
        id: "audit_1",
        actorUserId: "admin_1",
        actorType: "admin" as const,
        action: "deposit.approved",
        targetType: "deposit_intent",
        targetId: "deposit_1",
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
    findUserByAuthUserId: vi.fn(async (authUserId: string) =>
      authUserId === adminAppUser.authUserId ? adminAppUser : null,
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
  };

  const paymentRepository = {
    searchDepositIntents: vi.fn(async () => ({ rows: state.deposits, nextCursor: null })),
    searchWithdrawals: vi.fn(async () => ({ rows: [], nextCursor: null })),
    findDepositIntentById: vi.fn(
      async (id: string) =>
        state.deposits.find((deposit) => deposit.id === id) ?? state.deposits[0],
    ),
    findWithdrawalById: vi.fn(async (id: string) => ({
      id,
      userId: "user_1",
      currency: "USD",
      amountMinor: 50_00n,
      status: "under_review" as const,
      providerPayoutReference: null,
      createdAt: new Date("2026-07-13T12:00:00.000Z"),
      updatedAt: new Date("2026-07-13T12:00:00.000Z"),
    })),
    findProviderEventsRelatedToReference: vi.fn(async () => []),
    countDepositIntentsByStatus: vi.fn(async (status: string) => (status === "pending" ? 3 : 0)),
    countWithdrawalsByStatus: vi.fn(async (status: string) => {
      if (status === "approved") return 2;
      if (status === "under_review") return 4;
      return 0;
    }),
    countDepositsCreatedSince: vi.fn(async () => 7),
    countWithdrawalsCreatedSince: vi.fn(async () => 5),
    countProviderEvents: vi.fn(async (query: { deadLetteredOnly?: boolean } = {}) =>
      query.deadLetteredOnly ? 2 : 6,
    ),
    listRetryableProviderEvents: vi.fn(async () => []),
    listProviderEvents: vi.fn(async () => ({ rows: [], nextCursor: null })),
  };

  const ledgerRepository = {
    postLedgerTransaction: vi.fn(async () => {
      throw new Error("AdminFinancialOpsService must never post ledger transactions directly.");
    }),
  };

  const investmentRepository = {
    listInvestments: vi.fn(async () => ({ rows: [], nextCursor: null })),
    findInvestmentById: vi.fn(async (id: string) => ({ ...state.investment, id })),
    listRoiScheduleItemsByInvestmentId: vi.fn(async () => state.roiScheduleItems),
  };

  const settlementRepository = {
    listSettlementRuns: vi.fn(async () => ({ rows: [], nextCursor: null })),
    findSettlementRunById: vi.fn(async () => null),
    listSettlementItemsByRunId: vi.fn(async () => []),
    listSettlementItemsByInvestmentId: vi.fn(async () => state.settlementItems),
    sumPostedRoiMinorByInvestment: vi.fn(async () => 5_000n),
  };

  const operationsRepository = {
    appendAuditLog: vi.fn(async (_tx: unknown, values: Record<string, unknown>) => ({
      id: "audit_new",
      ...values,
      createdAt: new Date("2026-07-13T12:00:00.000Z"),
    })),
    createAdminEntityNote: vi.fn(
      async (
        _tx: unknown,
        values: { targetType: string; targetId: string; authorUserId: string; body: string },
      ) => ({
        id: "note_1",
        ...values,
        createdAt: new Date("2026-07-13T12:00:00.000Z"),
      }),
    ),
    listAdminEntityNotes: vi.fn(async () => []),
    listAuditLogsByTarget: vi.fn(async () => state.auditLogs),
    listRecentFinancialAuditLogs: vi.fn(async () => state.auditLogs),
    countBackgroundJobsByStatus: vi.fn(async () => 1),
    listBackgroundJobs: vi.fn(async () => ({ rows: [], nextCursor: null })),
  };

  const notificationRepository = {};

  const depositEngine = {
    adminApproveDeposit: vi.fn(async (depositId: string, reason: string) => ({
      depositIntent: { ...state.deposits[0], id: depositId, status: "confirmed" as const },
      idempotent: false,
      reason,
    })),
    adminRejectDeposit: vi.fn(async (depositId: string) => ({
      depositIntent: { ...state.deposits[0], id: depositId, status: "cancelled" as const },
      idempotent: false,
    })),
  };

  const withdrawalEngine = {
    approveWithdrawal: vi.fn(async (withdrawalId: string) => ({
      withdrawal: { id: withdrawalId, status: "approved" as const },
      idempotent: false,
    })),
    rejectWithdrawal: vi.fn(async (withdrawalId: string) => ({
      withdrawal: { id: withdrawalId, status: "rejected" as const },
      idempotent: false,
    })),
    queueWithdrawalPayout: vi.fn(async (withdrawalId: string) => ({
      withdrawal: { id: withdrawalId, status: "processing" as const },
      idempotent: false,
    })),
  };

  const transactionManager = {
    runInTransaction: async <TResult>(work: (tx: unknown) => Promise<TResult>) =>
      work({ db: {}, transactionId: "tx_1" }),
  };

  const clock = { now: () => new Date("2026-07-13T12:00:00.000Z") };

  const service = new AdminFinancialOpsService({
    identityProvider: identityProvider as never,
    clock,
    transactionManager: transactionManager as never,
    identityRepository: identityRepository as never,
    coreRepository: {} as never,
    paymentRepository: paymentRepository as never,
    ledgerRepository: ledgerRepository as never,
    investmentRepository: investmentRepository as never,
    settlementRepository: settlementRepository as never,
    operationsRepository: operationsRepository as never,
    notificationRepository: notificationRepository as never,
    depositEngine: depositEngine as never,
    withdrawalEngine: withdrawalEngine as never,
  });

  return {
    service,
    state,
    identityProvider,
    identityRepository,
    paymentRepository,
    ledgerRepository,
    investmentRepository,
    settlementRepository,
    operationsRepository,
    depositEngine,
    withdrawalEngine,
  };
}

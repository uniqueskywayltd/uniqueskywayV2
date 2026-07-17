import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/server-env", () => ({
  getServerEnv: () => ({
    NEXT_PUBLIC_APP_URL: "https://example.com",
    CONTACT_SUPPORT_EMAIL: "support@example.com",
  }),
}));

import type { AuthenticatedUser } from "@/application/auth";
import { AppError } from "@/application/errors";
import type { WithdrawalRequestRecord } from "@/infrastructure/database";

import { MANUAL_WITHDRAWAL_PROVIDER } from "./funding-constants";
import { WithdrawalEngineService } from "./withdrawal-engine-service";

describe("WithdrawalEngineService", () => {
  it("reserves funds once for repeated withdrawal idempotency keys", async () => {
    const fixture = createFixture({ availableBalanceMinor: 50_000n });

    const first = await fixture.service.createWithdrawalRequest(
      {
        amountMinor: 10_000n,
        currency: "USD",
        destinationType: "crypto_wallet",
        destinationReference: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        idempotencyKey: "withdrawal:create:1",
      },
      auditContext,
    );
    const second = await fixture.service.createWithdrawalRequest(
      {
        amountMinor: 10_000n,
        currency: "USD",
        destinationType: "crypto_wallet",
        destinationReference: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        idempotencyKey: "withdrawal:create:1",
      },
      auditContext,
    );

    expect(first.idempotent).toBe(false);
    expect(second.idempotent).toBe(true);
    expect(first.withdrawal.status).toBe("under_review");
    expect(first.withdrawal.provider).toBe(MANUAL_WITHDRAWAL_PROVIDER);
    expect(fixture.ledgerRepository.postLedgerTransaction).toHaveBeenCalledTimes(1);
    expect(fixture.state.withdrawals).toHaveLength(1);
  });

  it("rejects withdrawals when available balance is insufficient", async () => {
    const fixture = createFixture({ availableBalanceMinor: 5_000n });

    await expect(
      fixture.service.createWithdrawalRequest(
        {
          amountMinor: 10_000n,
          currency: "USD",
          destinationType: "bank_transfer",
          destinationReference: "Acct 1234567890",
          idempotencyKey: "withdrawal:create:insufficient",
        },
        auditContext,
      ),
    ).rejects.toMatchObject({
      code: "INVALID_STATE",
    });
    expect(fixture.ledgerRepository.postLedgerTransaction).not.toHaveBeenCalled();
  });

  it("releases reserved funds when an admin rejects a withdrawal", async () => {
    const fixture = createFixture({ withAdmin: true });
    fixture.state.withdrawals.push(
      createWithdrawal({
        id: "withdrawal_1",
        status: "under_review",
        reservationLedgerTransactionId: "ledger_reservation_1",
      }),
    );

    const result = await fixture.service.rejectWithdrawal(
      "withdrawal_1",
      { reason: "Risk review failed." },
      auditContext,
    );

    expect(result.withdrawal.status).toBe("rejected");
    expect(result.withdrawal.releaseLedgerTransactionId).toBe("ledger_tx_release");
    expect(fixture.ledgerRepository.postLedgerTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        transaction: expect.objectContaining({
          transactionType: "withdrawal_release",
          idempotencyKey: "withdrawal_release:withdrawal_1:rejected",
        }),
      }),
    );
  });

  it("approves and marks paid directly from approved status without a payment provider", async () => {
    const fixture = createFixture({ withAdmin: true });
    fixture.state.withdrawals.push(
      createWithdrawal({
        id: "withdrawal_1",
        status: "under_review",
        reservationLedgerTransactionId: "ledger_reservation_1",
      }),
    );

    const approved = await fixture.service.approveWithdrawal(
      "withdrawal_1",
      { reason: "Approved after review." },
      auditContext,
    );
    expect(approved.withdrawal.status).toBe("approved");

    const paid = await fixture.service.markWithdrawalPaid({
      withdrawalId: "withdrawal_1",
      providerPayoutReference: "USWWTH-PAID-1",
      context: auditContext,
    });
    expect(paid.withdrawal.status).toBe("paid");

    const paidReplay = await fixture.service.markWithdrawalPaid({
      withdrawalId: "withdrawal_1",
      providerPayoutReference: "USWWTH-PAID-1",
      context: auditContext,
    });
    expect(paidReplay.idempotent).toBe(true);
    expect(fixture.ledgerRepository.postLedgerTransaction).toHaveBeenCalledTimes(1);
  });

  it("queues manual payout processing and marks paid from processing status", async () => {
    const fixture = createFixture({ withAdmin: true });
    fixture.state.withdrawals.push(
      createWithdrawal({
        id: "withdrawal_1",
        status: "under_review",
        reservationLedgerTransactionId: "ledger_reservation_1",
      }),
    );

    await fixture.service.approveWithdrawal(
      "withdrawal_1",
      { reason: "Approved after review." },
      auditContext,
    );

    const queued = await fixture.service.queueWithdrawalPayout("withdrawal_1", auditContext);
    expect(queued.withdrawal.status).toBe("processing");
    expect(queued.withdrawal.provider).toBe(MANUAL_WITHDRAWAL_PROVIDER);
    expect(queued.withdrawal.providerPayoutReference).toMatch(/^USWWTH-/);

    const paid = await fixture.service.markWithdrawalPaid({
      withdrawalId: "withdrawal_1",
      providerPayoutReference: queued.withdrawal.providerPayoutReference!,
      context: auditContext,
    });
    expect(paid.withdrawal.status).toBe("paid");
  });

  it("blocks a second open withdrawal for the same currency", async () => {
    const fixture = createFixture({ availableBalanceMinor: 50_000n });
    fixture.state.withdrawals.push(
      createWithdrawal({
        id: "withdrawal_open",
        status: "under_review",
        reservationLedgerTransactionId: "ledger_reservation_open",
      }),
    );

    await expect(
      fixture.service.createWithdrawalRequest(
        {
          amountMinor: 10_000n,
          currency: "USD",
          destinationType: "crypto_wallet",
          destinationReference: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2",
          idempotencyKey: "withdrawal:create:pending-rule",
        },
        auditContext,
      ),
    ).rejects.toBeInstanceOf(AppError);
  });
});

const auditContext = {
  requestId: "request_1",
  ipAddressHash: null,
  userAgentHash: null,
};

function createFixture(options: { availableBalanceMinor?: bigint; withAdmin?: boolean } = {}) {
  const state = {
    withdrawals: [] as WithdrawalRequestRecord[],
    ledgerPostCount: 0,
  };
  const currentUser: AuthenticatedUser = {
    authUserId: "00000000-0000-0000-0000-000000000001",
    email: "customer@example.com",
    emailVerifiedAt: new Date("2026-07-13T12:00:00.000Z"),
    displayName: "Customer",
    mustChangePassword: false,
  };
  const appUser = {
    id: "user_1",
    authUserId: currentUser.authUserId,
    email: "customer@example.com",
    emailVerifiedAt: currentUser.emailVerifiedAt,
    status: "active",
    createdAt: new Date("2026-07-13T12:00:00.000Z"),
    updatedAt: new Date("2026-07-13T12:00:00.000Z"),
  };
  const adminUser = {
    ...appUser,
    id: "admin_1",
    authUserId: "00000000-0000-0000-0000-000000000099",
    email: "admin@example.com",
  };

  const transactionManager = {
    runInTransaction: async <TResult>(work: (tx: unknown) => Promise<TResult>) =>
      work({ db: {}, transactionId: "tx_1" }),
  };
  const identityProvider = {
    getCurrentUser: vi.fn(async () =>
      options.withAdmin ? { ...currentUser, authUserId: adminUser.authUserId } : currentUser,
    ),
  };
  const identityRepository = {
    findUserByAuthUserId: vi.fn(async (authUserId: string) =>
      authUserId === adminUser.authUserId ? adminUser : appUser,
    ),
    findUserById: vi.fn(async (userId: string) => (userId === adminUser.id ? adminUser : appUser)),
    findAdminProfileByUserId: vi.fn(async (userId: string) =>
      userId === adminUser.id ? { id: "admin_profile_1", userId, status: "active" } : null,
    ),
    listActiveRoleKeysForUser: vi.fn(async (userId: string) =>
      userId === adminUser.id ? ["finance_admin"] : [],
    ),
  };
  const coreRepository = {
    findCustomerAccountByUserId: vi.fn(async () => ({
      id: "account_1",
      userId: "user_1",
      accountNumber: "USW-0001",
      status: "active",
      restrictionReason: null,
      openedAt: new Date("2026-07-13T12:00:00.000Z"),
      closedAt: null,
      createdAt: new Date("2026-07-13T12:00:00.000Z"),
      updatedAt: new Date("2026-07-13T12:00:00.000Z"),
    })),
    findCustomerProfileByUserId: vi.fn(async () => ({
      id: "profile_1",
      userId: "user_1",
      legalName: "Test Customer",
      displayName: "Test Customer",
    })),
  };
  const paymentRepository = {
    findWithdrawalByIdempotencyKey: vi.fn(
      async (idempotencyKey: string) =>
        state.withdrawals.find((withdrawal) => withdrawal.idempotencyKey === idempotencyKey) ??
        null,
    ),
    findOpenWithdrawalByUserCurrency: vi.fn(async () => {
      return (
        state.withdrawals.find((withdrawal) =>
          ["reserved", "under_review", "approved", "processing"].includes(withdrawal.status),
        ) ?? null
      );
    }),
    createWithdrawalRequest: vi.fn(
      async (_tx: unknown, values: Partial<WithdrawalRequestRecord>) => {
        const withdrawal = createWithdrawal({
          id: `withdrawal_${state.withdrawals.length + 1}`,
          ...values,
        });
        state.withdrawals.push(withdrawal);
        return withdrawal;
      },
    ),
    lockWithdrawalById: vi.fn(
      async (_tx: unknown, id: string) =>
        state.withdrawals.find((withdrawal) => withdrawal.id === id) ?? null,
    ),
    markWithdrawalReserved: vi.fn(
      async (_tx: unknown, id: string, values: Partial<WithdrawalRequestRecord>) => {
        const withdrawal = requireWithdrawal(state, id);
        Object.assign(withdrawal, values, { status: "reserved" });
        return withdrawal;
      },
    ),
    markWithdrawalUnderReview: vi.fn(async (_tx: unknown, id: string) => {
      const withdrawal = requireWithdrawal(state, id);
      Object.assign(withdrawal, { status: "under_review" });
      return withdrawal;
    }),
    markWithdrawalApproved: vi.fn(
      async (_tx: unknown, id: string, values: Partial<WithdrawalRequestRecord>) => {
        const withdrawal = requireWithdrawal(state, id);
        Object.assign(withdrawal, values, { status: "approved", reviewedAt: new Date() });
        return withdrawal;
      },
    ),
    markWithdrawalRejected: vi.fn(
      async (_tx: unknown, id: string, values: Partial<WithdrawalRequestRecord>) => {
        const withdrawal = requireWithdrawal(state, id);
        Object.assign(withdrawal, values, { status: "rejected", reviewedAt: new Date() });
        return withdrawal;
      },
    ),
    markWithdrawalProcessing: vi.fn(
      async (_tx: unknown, id: string, values: Partial<WithdrawalRequestRecord>) => {
        const withdrawal = requireWithdrawal(state, id);
        Object.assign(withdrawal, values, {
          status: "processing",
          payoutInitiatedAt: new Date(),
        });
        return withdrawal;
      },
    ),
    markWithdrawalPaid: vi.fn(
      async (_tx: unknown, id: string, values: Partial<WithdrawalRequestRecord>) => {
        const withdrawal = requireWithdrawal(state, id);
        Object.assign(withdrawal, values, { status: "paid", paidAt: new Date() });
        return withdrawal;
      },
    ),
    findWithdrawalById: vi.fn(
      async (id: string) => state.withdrawals.find((withdrawal) => withdrawal.id === id) ?? null,
    ),
    listWithdrawalsByUserId: vi.fn(async () => state.withdrawals),
  };
  const ledgerRepository = {
    lockWalletByUserCurrency: vi.fn(async () => undefined),
    findWalletBalanceByUserCurrencyInTransaction: vi.fn(async () => ({
      walletId: "wallet_1",
      userId: "user_1",
      currency: "USD",
      pendingBalanceMinor: 0n,
      availableBalanceMinor: options.availableBalanceMinor ?? 50_000n,
      lockedBalanceMinor: 0n,
      reservedBalanceMinor: 0n,
      withdrawnBalanceMinor: 0n,
      lastEntryAt: null,
    })),
    findWalletAccountByCategoryInTransaction: vi.fn(
      async (_tx: unknown, input: { category: string }) => ({
        id: `${input.category}_account_1`,
        ownerType: "user",
        ownerId: "user_1",
        accountType: `customer_${input.category}_cash`,
        currency: "USD",
        status: "active",
        createdAt: new Date("2026-07-13T12:00:00.000Z"),
      }),
    ),
    postLedgerTransaction: vi.fn(
      async (_tx: unknown, input: { transaction: { transactionType: string } }) => {
        state.ledgerPostCount += 1;
        const id =
          input.transaction.transactionType === "withdrawal_reservation"
            ? "ledger_tx_reservation"
            : input.transaction.transactionType === "withdrawal_release"
              ? "ledger_tx_release"
              : "ledger_tx_payment";
        return {
          transaction: {
            id,
            transactionType: input.transaction.transactionType,
            idempotencyKey: "key",
            referenceType: "withdrawal_request",
            referenceId: "withdrawal_1",
            description: "test",
            metadata: {},
            postedAt: new Date("2026-07-13T12:00:00.000Z"),
            createdBy: null,
            createdAt: new Date("2026-07-13T12:00:00.000Z"),
          },
          entries: [],
        };
      },
    ),
  };
  const notificationRepository = {
    enqueueOutboxEvent: vi.fn(async () => ({})),
    createNotification: vi.fn(async () => ({})),
    enqueueEmail: vi.fn(async () => ({})),
  };
  const operationsRepository = {
    appendAuditLog: vi.fn(async () => ({})),
  };

  const service = new WithdrawalEngineService({
    identityProvider: identityProvider as never,
    clock: { now: () => new Date("2026-07-13T12:00:00.000Z") },
    transactionManager: transactionManager as never,
    identityRepository: identityRepository as never,
    coreRepository: coreRepository as never,
    paymentRepository: paymentRepository as never,
    ledgerRepository: ledgerRepository as never,
    notificationRepository: notificationRepository as never,
    operationsRepository: operationsRepository as never,
  });

  return {
    service,
    state,
    ledgerRepository,
  };
}

function createWithdrawal(values: Partial<WithdrawalRequestRecord>): WithdrawalRequestRecord {
  return {
    id: "withdrawal_1",
    userId: "user_1",
    currency: "USD",
    amountMinor: 10_000n,
    destinationType: "crypto_wallet",
    destinationReference: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    status: "requested",
    riskScore: null,
    reviewedBy: null,
    reviewedAt: null,
    reviewReason: null,
    idempotencyKey: "withdrawal:create:1",
    provider: MANUAL_WITHDRAWAL_PROVIDER,
    providerPayoutReference: null,
    providerMetadata: {},
    failureReason: null,
    reservationLedgerTransactionId: null,
    paymentLedgerTransactionId: null,
    releaseLedgerTransactionId: null,
    payoutInitiatedAt: null,
    paidAt: null,
    createdAt: new Date("2026-07-13T12:00:00.000Z"),
    updatedAt: new Date("2026-07-13T12:00:00.000Z"),
    ...values,
  };
}

function requireWithdrawal(state: { withdrawals: WithdrawalRequestRecord[] }, id: string) {
  const withdrawal = state.withdrawals.find((candidate) => candidate.id === id);
  if (!withdrawal) throw new Error("Missing withdrawal.");
  return withdrawal;
}

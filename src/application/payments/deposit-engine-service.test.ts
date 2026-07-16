import { describe, expect, it, vi } from "vitest";

import type { AuthenticatedUser } from "@/application/auth";
import type { DepositIntentRecord } from "@/infrastructure/database";

import { DepositEngineService } from "./deposit-engine-service";
import { MANUAL_DEPOSIT_PROVIDER } from "./funding-constants";

const FUNDING_WALLET_ID = "00000000-0000-4000-8000-000000000001";

describe("DepositEngineService", () => {
  it("creates a pending manual deposit once for repeated idempotency keys", async () => {
    const fixture = createFixture();

    const first = await fixture.service.createDepositIntent(
      {
        amountMinor: 25_000n,
        currency: "USD",
        provider: MANUAL_DEPOSIT_PROVIDER,
        asset: "USDT",
        fundingWalletId: FUNDING_WALLET_ID,
        transactionHash: "0xabc123def456",
        idempotencyKey: "deposit:create:1",
      },
      auditContext,
    );
    const second = await fixture.service.createDepositIntent(
      {
        amountMinor: 25_000n,
        currency: "USD",
        provider: MANUAL_DEPOSIT_PROVIDER,
        asset: "USDT",
        fundingWalletId: FUNDING_WALLET_ID,
        transactionHash: "0xabc123def456",
        idempotencyKey: "deposit:create:1",
      },
      auditContext,
    );

    expect(first.idempotent).toBe(false);
    expect(second.idempotent).toBe(true);
    expect(first.providerAction).toBeNull();
    expect(first.depositIntent.status).toBe("pending");
    expect(first.depositIntent.provider).toBe(MANUAL_DEPOSIT_PROVIDER);
    expect(first.depositIntent.fundingAsset).toBe("USDT");
    expect(first.depositIntent.transactionHash).toBe("0xabc123def456");
    expect(fixture.state.deposits).toHaveLength(1);
    expect(fixture.notificationRepository.enqueueOutboxEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ eventType: "deposit.initiated" }),
    );
  });

  it("confirms a pending deposit once when admin approval is replayed", async () => {
    const fixture = createFixture({ withAdmin: true });
    const deposit = createDeposit({
      id: "deposit_1",
      provider: MANUAL_DEPOSIT_PROVIDER,
      providerIntentId: "USWDEP-1",
      status: "pending",
      fundingAsset: "USDT",
      transactionHash: "0xabc123def456",
      fundingWalletId: FUNDING_WALLET_ID,
    });
    fixture.state.deposits.push(deposit);

    const first = await fixture.service.adminApproveDeposit(
      "deposit_1",
      "Verified on-chain transfer.",
      auditContext,
    );
    const second = await fixture.service.adminApproveDeposit(
      "deposit_1",
      "Verified on-chain transfer.",
      auditContext,
    );

    expect(first.idempotent).toBe(false);
    expect(second.idempotent).toBe(true);
    expect(fixture.ledgerRepository.postLedgerTransaction).toHaveBeenCalledTimes(1);
    expect(fixture.state.deposits[0]?.status).toBe("confirmed");
    expect(fixture.state.deposits[0]?.confirmationLedgerTransactionId).toBe("ledger_tx_1");
    expect(fixture.ledgerRepository.postLedgerTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        transaction: expect.objectContaining({
          idempotencyKey: "deposit_confirmation:manual:manual:deposit_1",
        }),
      }),
    );
  });

  it("cancels a created or pending deposit for the owning customer and is idempotent on replay", async () => {
    const fixture = createFixture();
    const deposit = createDeposit({ id: "deposit_1", status: "pending" });
    fixture.state.deposits.push(deposit);

    const first = await fixture.service.cancelDepositIntent("deposit_1", auditContext);
    expect(first.depositIntent.status).toBe("cancelled");
    expect(first.idempotent).toBe(false);

    const second = await fixture.service.cancelDepositIntent("deposit_1", auditContext);
    expect(second.idempotent).toBe(true);

    expect(fixture.notificationRepository.enqueueOutboxEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ eventType: "deposit.cancelled" }),
    );
  });

  it("rejects cancellation for deposits that are not created or pending", async () => {
    const fixture = createFixture();
    const deposit = createDeposit({
      id: "deposit_1",
      status: "confirmed",
      confirmationLedgerTransactionId: "ledger_tx_confirmed",
    });
    fixture.state.deposits.push(deposit);

    await expect(
      fixture.service.cancelDepositIntent("deposit_1", auditContext),
    ).rejects.toMatchObject({
      code: "INVALID_STATE",
    });
  });

  it("blocks a deposit reversal that would create a negative available balance", async () => {
    const fixture = createFixture({ withAdmin: true, availableBalanceMinor: 10_000n });
    const deposit = createDeposit({
      id: "deposit_1",
      status: "confirmed",
      confirmationLedgerTransactionId: "ledger_tx_confirmed",
      amountMinor: 25_000n,
    });
    fixture.state.deposits.push(deposit);

    await expect(
      fixture.service.reverseDepositIntent("deposit_1", auditContext, { reason: "chargeback" }),
    ).rejects.toMatchObject({ code: "FINANCIAL_INTEGRITY_ERROR" });

    expect(fixture.ledgerRepository.postLedgerTransaction).not.toHaveBeenCalled();
    expect(fixture.state.deposits[0]?.status).toBe("confirmed");
  });

  it("reverses a confirmed deposit with sufficient available balance", async () => {
    const fixture = createFixture({ withAdmin: true, availableBalanceMinor: 50_000n });
    const deposit = createDeposit({
      id: "deposit_1",
      status: "confirmed",
      confirmationLedgerTransactionId: "ledger_tx_confirmed",
      amountMinor: 25_000n,
      provider: MANUAL_DEPOSIT_PROVIDER,
    });
    fixture.state.deposits.push(deposit);

    const result = await fixture.service.reverseDepositIntent("deposit_1", auditContext, {
      reason: "chargeback",
      providerEventId: "manual:999",
    });

    expect(result.depositIntent.status).toBe("reversed");
    expect(fixture.ledgerRepository.postLedgerTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        transaction: expect.objectContaining({
          transactionType: "deposit_reversal",
          idempotencyKey: "deposit_reversal:manual:manual:999",
        }),
      }),
    );
  });
});

const auditContext = {
  requestId: "request_1",
  ipAddressHash: null,
  userAgentHash: null,
};

function createFixture(options: { withAdmin?: boolean; availableBalanceMinor?: bigint } = {}) {
  const state = {
    deposits: [] as DepositIntentRecord[],
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
  };
  const paymentRepository = {
    findDepositIntentByIdempotencyKey: vi.fn(
      async (idempotencyKey: string) =>
        state.deposits.find((deposit) => deposit.idempotencyKey === idempotencyKey) ?? null,
    ),
    createDepositIntent: vi.fn(async (_tx: unknown, values: Partial<DepositIntentRecord>) => {
      const deposit = createDeposit({
        id: "deposit_1",
        ...values,
      });
      state.deposits.push(deposit);
      return deposit;
    }),
    lockDepositIntentById: vi.fn(
      async (_tx: unknown, id: string) =>
        state.deposits.find((deposit) => deposit.id === id) ?? null,
    ),
    markDepositIntentCancelled: vi.fn(async (_tx: unknown, id: string, failureReason: string) => {
      const deposit = requireDeposit(state, id);
      Object.assign(deposit, { status: "cancelled", failureReason });
      return deposit;
    }),
    markDepositIntentReversed: vi.fn(
      async (_tx: unknown, id: string, values: Partial<DepositIntentRecord>) => {
        const deposit = requireDeposit(state, id);
        Object.assign(deposit, values, { status: "reversed" });
        return deposit;
      },
    ),
    markDepositIntentConfirmed: vi.fn(
      async (_tx: unknown, id: string, values: Partial<DepositIntentRecord>) => {
        const deposit = requireDeposit(state, id);
        Object.assign(deposit, values, {
          status: "confirmed",
          confirmedAt: new Date("2026-07-13T12:02:00.000Z"),
          updatedAt: new Date("2026-07-13T12:02:00.000Z"),
        });
        return deposit;
      },
    ),
    listDepositIntentsByUserId: vi.fn(async () => state.deposits),
    listDepositIntents: vi.fn(async () => state.deposits),
  };
  const ledgerRepository = {
    lockWalletByUserCurrency: vi.fn(async () => undefined),
    findWalletBalanceByUserCurrencyInTransaction: vi.fn(async () => ({
      walletId: "wallet_1",
      userId: "user_1",
      currency: "USD",
      pendingBalanceMinor: 0n,
      availableBalanceMinor: options.availableBalanceMinor ?? 0n,
      lockedBalanceMinor: 0n,
      reservedBalanceMinor: 0n,
      withdrawnBalanceMinor: 0n,
      lastEntryAt: null,
    })),
    findWalletAccountByCategoryInTransaction: vi.fn(async () => ({
      id: "available_account_1",
      ownerType: "user",
      ownerId: "user_1",
      accountType: "customer_available_cash",
      currency: "USD",
      status: "active",
      createdAt: new Date("2026-07-13T12:00:00.000Z"),
    })),
    ensureLedgerAccount: vi.fn(async () => ({
      id: "provider_clearing_1",
      ownerType: "provider",
      ownerId: MANUAL_DEPOSIT_PROVIDER,
      accountType: "provider_cash_clearing",
      currency: "USD",
      status: "active",
      createdAt: new Date("2026-07-13T12:00:00.000Z"),
    })),
    postLedgerTransaction: vi.fn(async () => ({
      transaction: {
        id: "ledger_tx_1",
        transactionType: "deposit_confirmation",
        idempotencyKey: "deposit_confirmation:manual:manual:deposit_1",
        referenceType: "deposit_intent",
        referenceId: "deposit_1",
        description: "Manual admin deposit confirmation",
        metadata: {},
        postedAt: new Date("2026-07-13T12:02:00.000Z"),
        createdBy: null,
        createdAt: new Date("2026-07-13T12:02:00.000Z"),
      },
      entries: [],
    })),
  };
  const notificationRepository = {
    enqueueOutboxEvent: vi.fn(async () => ({})),
    createNotification: vi.fn(async () => ({})),
    enqueueEmail: vi.fn(async () => ({})),
  };
  const operationsRepository = {
    appendAuditLog: vi.fn(async () => ({})),
  };

  const service = new DepositEngineService({
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
    paymentRepository,
    notificationRepository,
  };
}

function createDeposit(values: Partial<DepositIntentRecord>): DepositIntentRecord {
  return {
    id: "deposit_1",
    userId: "user_1",
    provider: MANUAL_DEPOSIT_PROVIDER,
    providerIntentId: "USWDEP-1",
    currency: "USD",
    amountMinor: 25_000n,
    status: "created",
    idempotencyKey: "deposit:create:1",
    providerAuthorizationUrl: null,
    providerAccessCode: null,
    providerMetadata: {},
    fundingAsset: null,
    fundingNetwork: null,
    transactionHash: null,
    customerNote: null,
    fundingWalletId: null,
    failureReason: null,
    confirmationLedgerTransactionId: null,
    reversalLedgerTransactionId: null,
    createdAt: new Date("2026-07-13T12:00:00.000Z"),
    confirmedAt: null,
    updatedAt: new Date("2026-07-13T12:00:00.000Z"),
    ...values,
  };
}

function requireDeposit(state: { deposits: DepositIntentRecord[] }, id: string) {
  const deposit = state.deposits.find((candidate) => candidate.id === id);
  if (!deposit) throw new Error("Missing deposit.");
  return deposit;
}

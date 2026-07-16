import { describe, expect, it, vi } from "vitest";

import type { AuthenticatedUser } from "@/application/auth";
import type { DepositIntentRecord, PaymentProviderEventRecord } from "@/infrastructure/database";

import { DepositEngineService } from "./deposit-engine-service";
import { hashWebhookPayload } from "./webhook-processing";

describe("DepositEngineService", () => {
  it("creates provider checkout once for repeated deposit idempotency keys", async () => {
    const fixture = createFixture();

    const first = await fixture.service.createDepositIntent(
      {
        amountMinor: 25_000n,
        currency: "USD",
        provider: "paystack",
        idempotencyKey: "deposit:create:1",
      },
      auditContext,
    );
    const second = await fixture.service.createDepositIntent(
      {
        amountMinor: 25_000n,
        currency: "USD",
        provider: "paystack",
        idempotencyKey: "deposit:create:1",
      },
      auditContext,
    );

    expect(first.idempotent).toBe(false);
    expect(second.idempotent).toBe(true);
    expect(first.providerAction?.reference).toMatch(/^USWDEP-/);
    expect(first.providerAction?.authorizationUrl).toBe(
      `https://checkout.paystack.test/${first.providerAction?.reference}`,
    );
    expect(fixture.provider.initializeDeposit).toHaveBeenCalledTimes(1);
    expect(fixture.state.deposits).toHaveLength(1);
  });

  it("confirms a deposit once when Paystack webhooks are replayed, claiming the event and using the provider event id for ledger idempotency", async () => {
    const fixture = createFixture();
    const deposit = createDeposit({
      id: "deposit_1",
      providerIntentId: "USWDEP-1",
      status: "pending",
      providerAuthorizationUrl: "https://checkout.paystack.test/USWDEP-1",
      providerAccessCode: "access",
    });
    fixture.state.deposits.push(deposit);

    const rawBody = JSON.stringify({
      event: "charge.success",
      data: {
        id: 12345,
        reference: "USWDEP-1",
        amount: 25_000,
        currency: "USD",
      },
    });

    const first = await fixture.service.processPaystackWebhook({
      rawBody,
      signature: "valid",
      context: auditContext,
    });
    const second = await fixture.service.processPaystackWebhook({
      rawBody,
      signature: "valid",
      context: auditContext,
    });

    expect(first.status).toBe("processed");
    expect(second.status).toBe("duplicate");
    expect(fixture.ledgerRepository.postLedgerTransaction).toHaveBeenCalledTimes(1);
    expect(fixture.state.deposits[0]?.status).toBe("confirmed");
    expect(fixture.state.deposits[0]?.confirmationLedgerTransactionId).toBe("ledger_tx_1");

    expect(fixture.paymentRepository.claimProviderEventForProcessing).toHaveBeenCalledTimes(1);
    const claimedEvent = fixture.state.providerEvents.find(
      (event) => event.providerEventId === "charge.success:12345",
    );
    expect(claimedEvent?.attemptCount).toBe(1);
    expect(claimedEvent?.status).toBe("processed");

    expect(fixture.ledgerRepository.postLedgerTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        transaction: expect.objectContaining({
          idempotencyKey: "deposit_confirmation:paystack:charge.success:12345",
        }),
      }),
    );
  });

  it("cancels a created or pending deposit for the owning customer and is idempotent on replay", async () => {
    const fixture = createFixture();
    const deposit = createDeposit({ id: "deposit_1", status: "created" });
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
    });
    fixture.state.deposits.push(deposit);

    const result = await fixture.service.reverseDepositIntent("deposit_1", auditContext, {
      reason: "chargeback",
      providerEventId: "charge.dispute:999",
    });

    expect(result.depositIntent.status).toBe("reversed");
    expect(fixture.ledgerRepository.postLedgerTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        transaction: expect.objectContaining({
          transactionType: "deposit_reversal",
          idempotencyKey: "deposit_reversal:paystack:charge.dispute:999",
        }),
      }),
    );
  });

  it("retries a failed provider event with backoff and dead-letters it after exhausting attempts", async () => {
    const fixture = createFixture();
    const deposit = createDeposit({
      id: "deposit_1",
      providerIntentId: "USWDEP-1",
      status: "pending",
    });
    fixture.state.deposits.push(deposit);

    const rawBody = JSON.stringify({
      event: "charge.success",
      data: { id: 12345, reference: "USWDEP-1", amount: 25_000, currency: "USD" },
    });
    fixture.state.providerEvents.push(
      createProviderEvent({
        id: "event_1",
        providerEventId: "charge.success:12345",
        eventType: "charge.success",
        payloadHash: hashWebhookPayload(rawBody),
        payload: JSON.parse(rawBody),
        status: "failed",
        attemptCount: 9,
        nextRetryAt: null,
        deadLetteredAt: null,
      }),
    );
    fixture.provider.verifyDeposit.mockResolvedValueOnce({
      provider: "paystack",
      providerReference: "USWDEP-1",
      status: "failed" as never,
      amountMinor: 25_000n,
      currency: "USD",
      metadata: {},
    });

    await expect(
      fixture.service.processPaystackWebhook({
        rawBody,
        signature: "valid",
        context: auditContext,
      }),
    ).rejects.toMatchObject({ code: "PROVIDER_ERROR" });

    const event = fixture.state.providerEvents.find((candidate) => candidate.id === "event_1");
    expect(event?.attemptCount).toBe(10);
    expect(event?.deadLetteredAt).not.toBeNull();
    expect(fixture.paymentRepository.markProviderEventDeadLettered).toHaveBeenCalledTimes(1);
    expect(fixture.notificationRepository.enqueueOutboxEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ eventType: "payment.provider_event.dead_lettered" }),
    );
  });

  it("schedules a retry with next_retry_at backoff when attempts remain", async () => {
    const fixture = createFixture();
    const deposit = createDeposit({
      id: "deposit_1",
      providerIntentId: "USWDEP-1",
      status: "pending",
    });
    fixture.state.deposits.push(deposit);

    const rawBody = JSON.stringify({
      event: "charge.success",
      data: { id: 12345, reference: "USWDEP-1", amount: 25_000, currency: "USD" },
    });
    fixture.provider.verifyDeposit.mockResolvedValueOnce({
      provider: "paystack",
      providerReference: "USWDEP-1",
      status: "failed" as never,
      amountMinor: 25_000n,
      currency: "USD",
      metadata: {},
    });

    await expect(
      fixture.service.processPaystackWebhook({
        rawBody,
        signature: "valid",
        context: auditContext,
      }),
    ).rejects.toMatchObject({ code: "PROVIDER_ERROR" });

    const event = fixture.state.providerEvents.find(
      (candidate) => candidate.providerEventId === "charge.success:12345",
    );
    expect(event?.status).toBe("failed");
    expect(event?.attemptCount).toBe(1);
    expect(event?.deadLetteredAt).toBeNull();
    expect(event?.nextRetryAt).toEqual(new Date("2026-07-13T12:01:00.000Z"));
  });

  it("recovers a previously failed provider event and confirms the deposit on retry", async () => {
    const fixture = createFixture();
    const deposit = createDeposit({
      id: "deposit_1",
      providerIntentId: "USWDEP-1",
      status: "pending",
    });
    fixture.state.deposits.push(deposit);
    fixture.state.providerEvents.push(
      createProviderEvent({
        id: "event_1",
        providerEventId: "charge.success:12345",
        eventType: "charge.success",
        payload: {
          event: "charge.success",
          data: { id: 12345, reference: "USWDEP-1", amount: 25_000, currency: "USD" },
        },
        status: "failed",
        attemptCount: 1,
        nextRetryAt: new Date("2026-07-13T11:00:00.000Z"),
        deadLetteredAt: null,
      }),
    );

    const result = await fixture.service.recoverProviderEvents();

    expect(result).toEqual({ attempted: 1, processed: 1, failed: 0, deadLettered: 0 });
    expect(fixture.state.deposits[0]?.status).toBe("confirmed");
    const event = fixture.state.providerEvents.find((candidate) => candidate.id === "event_1");
    expect(event?.status).toBe("processed");
    expect(event?.attemptCount).toBe(2);
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
    providerEvents: [] as PaymentProviderEventRecord[],
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
    updateDepositIntentProviderAction: vi.fn(
      async (_tx: unknown, id: string, values: Partial<DepositIntentRecord>) => {
        const deposit = requireDeposit(state, id);
        Object.assign(deposit, values, { updatedAt: new Date("2026-07-13T12:01:00.000Z") });
        return deposit;
      },
    ),
    markDepositIntentFailed: vi.fn(async (_tx: unknown, id: string, failureReason: string) => {
      const deposit = requireDeposit(state, id);
      Object.assign(deposit, { status: "failed", failureReason });
      return deposit;
    }),
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
    findDepositIntentByProviderIntent: vi.fn(
      async (_provider: string, providerIntentId: string) =>
        state.deposits.find((deposit) => deposit.providerIntentId === providerIntentId) ?? null,
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
    recordProviderEvent: vi.fn(
      async (_tx: unknown, values: Partial<PaymentProviderEventRecord>) => {
        const existing = state.providerEvents.find(
          (event) =>
            event.provider === values.provider && event.providerEventId === values.providerEventId,
        );
        if (existing) return existing;
        const event = createProviderEvent(values);
        state.providerEvents.push(event);
        return event;
      },
    ),
    updateProviderEventStatus: vi.fn(
      async (_tx: unknown, id: string, values: Partial<PaymentProviderEventRecord>) => {
        const event = state.providerEvents.find((candidate) => candidate.id === id);
        if (!event) throw new Error("Missing provider event.");
        Object.assign(event, values);
        return event;
      },
    ),
    lockProviderEventById: vi.fn(
      async (_tx: unknown, id: string) =>
        state.providerEvents.find((event) => event.id === id) ?? null,
    ),
    claimProviderEventForProcessing: vi.fn(async (_tx: unknown, id: string) => {
      const event = state.providerEvents.find((candidate) => candidate.id === id);
      if (!event) return null;
      event.status = "processing";
      event.attemptCount += 1;
      return event;
    }),
    listRetryableProviderEvents: vi.fn(async (limit = 50) =>
      state.providerEvents
        .filter((event) => event.status === "failed" && !event.deadLetteredAt)
        .slice(0, limit),
    ),
    markProviderEventDeadLettered: vi.fn(async (_tx: unknown, id: string, errorMessage: string) => {
      const event = state.providerEvents.find((candidate) => candidate.id === id);
      if (!event) throw new Error("Missing provider event.");
      Object.assign(event, {
        status: "failed",
        deadLetteredAt: new Date("2026-07-13T12:00:00.000Z"),
        errorMessage,
      });
      return event;
    }),
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
    findWalletAccountByCategory: vi.fn(async () => ({
      id: "available_account_1",
      ownerType: "user",
      ownerId: "user_1",
      accountType: "customer_available_cash",
      currency: "USD",
      status: "active",
      createdAt: new Date("2026-07-13T12:00:00.000Z"),
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
      ownerId: "paystack",
      accountType: "provider_cash_clearing",
      currency: "USD",
      status: "active",
      createdAt: new Date("2026-07-13T12:00:00.000Z"),
    })),
    postLedgerTransaction: vi.fn(async () => ({
      transaction: {
        id: "ledger_tx_1",
        transactionType: "deposit_confirmation",
        idempotencyKey: "deposit_confirmation:paystack:deposit_1",
        referenceType: "deposit_intent",
        referenceId: "deposit_1",
        description: "Customer deposit confirmation",
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
  const provider = {
    provider: "paystack" as const,
    initializeDeposit: vi.fn(async (input: { reference: string }) => ({
      provider: "paystack" as const,
      providerReference: input.reference,
      authorizationUrl: `https://checkout.paystack.test/${input.reference}`,
      accessCode: "access",
      metadata: {},
    })),
    verifyDeposit: vi.fn(async (input: { reference: string }) => ({
      provider: "paystack" as const,
      providerReference: input.reference,
      status: "success" as const,
      amountMinor: 25_000n,
      currency: "USD",
      metadata: {},
    })),
    verifyWebhookSignature: vi.fn(() => true),
    initiatePayout: vi.fn(),
    verifyPayout: vi.fn(),
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
    paymentProvider: provider,
  });

  return {
    service,
    state,
    provider,
    ledgerRepository,
    paymentRepository,
    notificationRepository,
  };
}

function createDeposit(values: Partial<DepositIntentRecord>): DepositIntentRecord {
  return {
    id: "deposit_1",
    userId: "user_1",
    provider: "paystack",
    providerIntentId: "USWDEP-1",
    currency: "USD",
    amountMinor: 25_000n,
    status: "created",
    idempotencyKey: "deposit:create:1",
    providerAuthorizationUrl: null,
    providerAccessCode: null,
    providerMetadata: {},
    failureReason: null,
    confirmationLedgerTransactionId: null,
    reversalLedgerTransactionId: null,
    createdAt: new Date("2026-07-13T12:00:00.000Z"),
    confirmedAt: null,
    updatedAt: new Date("2026-07-13T12:00:00.000Z"),
    ...values,
  };
}

function createProviderEvent(
  values: Partial<PaymentProviderEventRecord>,
): PaymentProviderEventRecord {
  return {
    id: `event_${values.providerEventId ?? "1"}`,
    provider: "paystack",
    providerEventId: "charge.success:12345",
    eventType: "charge.success",
    payloadHash: "hash",
    payload: {},
    status: "received",
    attemptCount: 0,
    nextRetryAt: null,
    deadLetteredAt: null,
    receivedAt: new Date("2026-07-13T12:00:00.000Z"),
    processedAt: null,
    errorMessage: null,
    ...values,
  };
}

function requireDeposit(state: { deposits: DepositIntentRecord[] }, id: string) {
  const deposit = state.deposits.find((candidate) => candidate.id === id);
  if (!deposit) throw new Error("Missing deposit.");
  return deposit;
}

import { describe, expect, it } from "vitest";

import { AppError } from "@/application/errors";
import type { Clock } from "@/application/ports";
import type {
  CoreRepository,
  DrizzleTransactionContext,
  DrizzleTransactionManager,
  InvestmentRecord,
  InvestmentRepository,
  LedgerRepository,
  SettlementRepository,
} from "@/infrastructure/database";

import { InvestmentEngineService } from "./investment-engine-service";

const WORKER_COUNT = 500;
const activationTime = new Date("2026-07-12T16:00:00.000Z");
const settlementClock = new Date("2026-07-14T05:00:00.000Z");

describe("Phase 6.2 investment engine concurrency certification", () => {
  it(
    "deduplicates 500 concurrent activation requests with the same idempotency key",
    { timeout: 30_000 },
    async () => {
      const harness = createConcurrencyHarness();

      const results = await Promise.all(
        Array.from({ length: WORKER_COUNT }, () =>
          harness.service.activateInvestment({
            userId: "user_1",
            planVersionId: "plan_version_1",
            principalMinor: 10_000n,
            idempotencyKey: "activation:shared",
            activatedAt: activationTime,
          }),
        ),
      );

      expect(results.filter((result) => result.idempotent)).toHaveLength(WORKER_COUNT - 1);
      expect(results.filter((result) => !result.idempotent)).toHaveLength(1);
      expect(harness.state.investments.size).toBe(1);
      expect(harness.ledgerTransactionsByType("investment_funding")).toHaveLength(1);
      expect(harness.state.roiScheduleItems).toHaveLength(3);
      expect(harness.state.availableBalanceMinor).toBe(10_000n);
      expect(harness.state.lockedBalanceMinor).toBe(10_000n);
    },
  );

  it(
    "prevents 500 concurrent unique activation requests from over-locking available balance",
    { timeout: 30_000 },
    async () => {
      const harness = createConcurrencyHarness({ availableBalanceMinor: 10_000n });

      const results = await Promise.allSettled(
        Array.from({ length: WORKER_COUNT }, (_, index) =>
          harness.service.activateInvestment({
            userId: "user_1",
            planVersionId: "plan_version_1",
            principalMinor: 10_000n,
            idempotencyKey: `activation:unique:${index}`,
            activatedAt: activationTime,
          }),
        ),
      );
      const fulfilled = results.filter((result) => result.status === "fulfilled");
      const rejected = results.filter((result) => result.status === "rejected");

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(WORKER_COUNT - 1);
      expect(
        rejected.every(
          (result) => result.status === "rejected" && result.reason instanceof AppError,
        ),
      ).toBe(true);
      expect(harness.state.investments.size).toBe(1);
      expect(harness.ledgerTransactionsByType("investment_funding")).toHaveLength(1);
      expect(harness.state.availableBalanceMinor).toBe(0n);
      expect(harness.state.lockedBalanceMinor).toBe(10_000n);
    },
  );

  it(
    "prevents duplicate cron settlement runs from double-crediting ROI or maturity principal",
    { timeout: 30_000 },
    async () => {
      const harness = createConcurrencyHarness();
      harness.seedActiveInvestment({
        firstSettlementDate: "2026-07-13",
        maturityDate: "2026-07-13",
        promisedRoiMinor: 100n,
        termDays: 1,
      });

      const results = await Promise.allSettled(
        Array.from({ length: WORKER_COUNT }, (_, index) =>
          harness.service.runSettlement({
            settlementDate: "2026-07-13",
            runType: "daily",
            lockedBy: `cron-${index}`,
          }),
        ),
      );
      const fulfilled = results.filter((result) => result.status === "fulfilled");

      expect(fulfilled.length).toBeGreaterThanOrEqual(1);
      expect(harness.state.settlementItems.size).toBe(1);
      expect(harness.state.roiLedgerEntries).toHaveLength(1);
      expect(harness.ledgerTransactionsByType("roi_settlement")).toHaveLength(1);
      expect(harness.ledgerTransactionsByType("maturity_principal_release")).toHaveLength(1);
      expect(harness.state.lockedBalanceMinor).toBe(0n);
      expect(harness.state.availableBalanceMinor).toBe(20_100n);
      expect(harness.onlyInvestment()?.status).toBe("matured");
    },
  );

  it(
    "allows only one of 500 racing settlement workers to post a final-day settlement",
    { timeout: 30_000 },
    async () => {
      const harness = createConcurrencyHarness();
      const investment = harness.seedActiveInvestment({
        firstSettlementDate: "2026-07-13",
        maturityDate: "2026-07-13",
        promisedRoiMinor: 100n,
        termDays: 1,
      });
      harness.seedSettlementRun("settlement_run_existing");
      const settleInvestment = Reflect.get(harness.service, "settleInvestment") as (
        settlementRunId: string,
        investment: InvestmentRecord,
        settlementDate: string,
      ) => Promise<{ investmentId: string; status: "posted" | "skipped" }>;

      const results = await Promise.all(
        Array.from({ length: WORKER_COUNT }, () =>
          settleInvestment.call(
            harness.service,
            "settlement_run_existing",
            investment,
            "2026-07-13",
          ),
        ),
      );

      expect(results.filter((result) => result.status === "posted")).toHaveLength(1);
      expect(results.filter((result) => result.status === "skipped")).toHaveLength(
        WORKER_COUNT - 1,
      );
      expect(harness.state.settlementItems.size).toBe(1);
      expect(harness.state.roiLedgerEntries).toHaveLength(1);
      expect(harness.ledgerTransactionsByType("roi_settlement")).toHaveLength(1);
      expect(harness.ledgerTransactionsByType("maturity_principal_release")).toHaveLength(1);
      expect(harness.onlyInvestment()?.status).toBe("matured");
    },
  );

  it("rejects duplicate ledger idempotency keys without writing duplicate entries", async () => {
    const harness = createConcurrencyHarness();

    await harness.transactionManager.runInTransaction((tx) =>
      harness.ledgerRepository.postLedgerTransaction(tx, {
        transaction: {
          transactionType: "roi_settlement",
          idempotencyKey: "ledger:duplicate",
          referenceType: "investment",
          referenceId: "investment_1",
        },
        entries: [
          {
            accountId: "platform_roi_expense",
            direction: "debit",
            amountMinor: 100n,
            currency: "USD",
          },
          {
            accountId: "customer_available",
            direction: "credit",
            amountMinor: 100n,
            currency: "USD",
          },
        ],
      }),
    );

    await expect(
      harness.transactionManager.runInTransaction((tx) =>
        harness.ledgerRepository.postLedgerTransaction(tx, {
          transaction: {
            transactionType: "roi_settlement",
            idempotencyKey: "ledger:duplicate",
            referenceType: "investment",
            referenceId: "investment_1",
          },
          entries: [
            {
              accountId: "platform_roi_expense",
              direction: "debit",
              amountMinor: 100n,
              currency: "USD",
            },
            {
              accountId: "customer_available",
              direction: "credit",
              amountMinor: 100n,
              currency: "USD",
            },
          ],
        }),
      ),
    ).rejects.toThrow(UniqueConstraintError);

    expect(harness.ledgerTransactionsByType("roi_settlement")).toHaveLength(1);
    expect(harness.state.ledgerEntries).toHaveLength(2);
  });

  it("prevents a skewed worker from settling the current New York day early", async () => {
    const earlyWorker = createConcurrencyHarness({
      clockNow: new Date("2026-07-13T05:00:00.000Z"),
    });
    earlyWorker.seedActiveInvestment({
      firstSettlementDate: "2026-07-13",
      maturityDate: "2026-07-13",
      promisedRoiMinor: 100n,
      termDays: 1,
    });

    await expect(
      earlyWorker.service.runSettlement({
        settlementDate: "2026-07-13",
        runType: "daily",
        lockedBy: "skewed-worker",
      }),
    ).rejects.toThrow(AppError);
    expect(earlyWorker.state.settlementRuns.size).toBe(0);
    expect(earlyWorker.state.settlementItems.size).toBe(0);
    expect(earlyWorker.ledgerTransactionsByType("roi_settlement")).toHaveLength(0);

    const completedDayWorker = createConcurrencyHarness({
      clockNow: new Date("2026-07-14T05:00:00.000Z"),
    });
    completedDayWorker.seedActiveInvestment({
      firstSettlementDate: "2026-07-13",
      maturityDate: "2026-07-13",
      promisedRoiMinor: 100n,
      termDays: 1,
    });

    const result = await completedDayWorker.service.runSettlement({
      settlementDate: "2026-07-13",
      runType: "daily",
      lockedBy: "completed-day-worker",
    });

    expect(result.posted).toBe(1);
    expect(completedDayWorker.ledgerTransactionsByType("roi_settlement")).toHaveLength(1);
  });
});

interface TestTransactionContext extends DrizzleTransactionContext {
  readonly releases: Array<() => void>;
}

interface HarnessOptions {
  availableBalanceMinor?: bigint;
  clockNow?: Date;
}

interface InvestmentOverrides {
  firstSettlementDate: string;
  maturityDate: string;
  promisedRoiMinor: bigint | null;
  termDays: number;
}

class UniqueConstraintError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UniqueConstraintError";
  }
}

class Mutex {
  private current = Promise.resolve();

  async acquire(): Promise<() => void> {
    let releaseNext!: () => void;
    const next = new Promise<void>((resolve) => {
      releaseNext = resolve;
    });
    const previous = this.current;
    this.current = this.current.then(() => next);
    await previous;

    let released = false;
    return () => {
      if (!released) {
        released = true;
        releaseNext();
      }
    };
  }
}

function createConcurrencyHarness(options: HarnessOptions = {}) {
  const state = {
    availableBalanceMinor: options.availableBalanceMinor ?? 20_000n,
    lockedBalanceMinor: 0n,
    investments: new Map<string, InvestmentRecord>(),
    investmentIdsByIdempotencyKey: new Map<string, string>(),
    roiScheduleItems: [] as Array<Record<string, unknown>>,
    settlementRuns: new Map<string, Record<string, unknown>>(),
    settlementItems: new Map<string, Record<string, unknown>>(),
    roiLedgerEntries: [] as Array<Record<string, unknown>>,
    ledgerTransactions: [] as Array<Record<string, unknown>>,
    ledgerEntries: [] as Array<Record<string, unknown>>,
    transactionIdSequence: 0,
    investmentIdSequence: 0,
    settlementRunIdSequence: 0,
    settlementItemIdSequence: 0,
    ledgerTransactionIdSequence: 0,
    ledgerEntryIdSequence: 0,
    roiLedgerEntryIdSequence: 0,
    locks: new Map<string, Mutex>(),
  };
  const clock: Clock = { now: () => options.clockNow ?? settlementClock };
  const transactionManager = {
    runInTransaction: async <TResult>(
      work: (context: DrizzleTransactionContext) => Promise<TResult>,
    ) => {
      const context = {
        db: {},
        transactionId: `tx_${(state.transactionIdSequence += 1)}`,
        releases: [],
      } as unknown as TestTransactionContext;

      try {
        return await work(context);
      } finally {
        while (context.releases.length > 0) {
          context.releases.pop()?.();
        }
      }
    },
  } as DrizzleTransactionManager;

  const getLock = (key: string) => {
    const existing = state.locks.get(key);
    if (existing) return existing;
    const lock = new Mutex();
    state.locks.set(key, lock);
    return lock;
  };
  const lockForTransaction = async (context: DrizzleTransactionContext, key: string) => {
    const release = await getLock(key).acquire();
    (context as TestTransactionContext).releases.push(release);
  };
  const findInvestmentByIdempotencyKey = (idempotencyKey: string) => {
    const investmentId = state.investmentIdsByIdempotencyKey.get(idempotencyKey);
    return investmentId ? (state.investments.get(investmentId) ?? null) : null;
  };

  const coreRepository = {
    findInvestmentPlanVersionById: async () => ({
      id: "plan_version_1",
      status: "active",
      currency: "USD",
      minPrincipalMinor: 1_000n,
      maxPrincipalMinor: 100_000n,
      termDays: 3,
      dailyRoiBps: 100,
      totalRoiBps: 300,
      principalReturnPolicy: "return_at_maturity",
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      effectiveTo: null,
    }),
  } as unknown as CoreRepository;

  const investmentRepository = {
    findInvestmentByIdempotencyKey: async (idempotencyKey: string) =>
      findInvestmentByIdempotencyKey(idempotencyKey),
    findInvestmentByIdempotencyKeyInTransaction: async (
      _context: DrizzleTransactionContext,
      idempotencyKey: string,
    ) => findInvestmentByIdempotencyKey(idempotencyKey),
    findInvestmentById: async (id: string) => state.investments.get(id) ?? null,
    lockInvestmentById: async (context: DrizzleTransactionContext, investmentId: string) => {
      await lockForTransaction(context, `investment:${investmentId}`);
      return state.investments.get(investmentId) ?? null;
    },
    createInvestment: async (
      _context: DrizzleTransactionContext,
      values: Record<string, unknown>,
    ) => {
      const idempotencyKey = values.idempotencyKey as string | null;
      if (idempotencyKey && state.investmentIdsByIdempotencyKey.has(idempotencyKey)) {
        throw new UniqueConstraintError("Duplicate investment idempotency key.");
      }

      const id = `investment_${(state.investmentIdSequence += 1)}`;
      const investment = createInvestmentRecord({
        ...values,
        id,
        status: values.status ?? "pending",
        createdAt: activationTime,
        activatedAt: null,
        maturedAt: null,
        cancelledAt: null,
        startAt: null,
        firstSettlementDate: null,
        maturityDate: null,
        roundingResidualMicroMinor: 0n,
        fundingLedgerTransactionId: null,
        maturityLedgerTransactionId: null,
      });
      state.investments.set(id, investment);
      if (idempotencyKey) state.investmentIdsByIdempotencyKey.set(idempotencyKey, id);

      return investment;
    },
    updateInvestmentActivation: async (
      _context: DrizzleTransactionContext,
      investmentId: string,
      values: Record<string, unknown>,
    ) => updateInvestment(state, investmentId, values),
    createRoiScheduleItem: async (
      _context: DrizzleTransactionContext,
      values: Record<string, unknown>,
    ) => {
      state.roiScheduleItems.push(values);
      return { id: `schedule_${state.roiScheduleItems.length}`, ...values };
    },
    listActiveInvestmentsEligibleForSettlement: async (settlementDate: string) =>
      Array.from(state.investments.values()).filter(
        (investment) =>
          investment.status === "active" &&
          investment.firstSettlementDate !== null &&
          investment.maturityDate !== null &&
          investment.firstSettlementDate <= settlementDate &&
          investment.maturityDate >= settlementDate,
      ),
    updateInvestmentResidual: async (
      _context: DrizzleTransactionContext,
      investmentId: string,
      roundingResidualMicroMinor: bigint,
    ) => updateInvestment(state, investmentId, { roundingResidualMicroMinor }),
    markInvestmentMatured: async (
      _context: DrizzleTransactionContext,
      investmentId: string,
      values: Record<string, unknown>,
    ) => updateInvestment(state, investmentId, { status: "matured", ...values }),
    markInvestmentMaturing: async (
      _context: DrizzleTransactionContext,
      investmentId: string,
      roundingResidualMicroMinor: bigint,
    ) => updateInvestment(state, investmentId, { status: "maturing", roundingResidualMicroMinor }),
    markRoiScheduleItemPosted: async () => ({ id: "schedule_posted" }),
  } as unknown as InvestmentRepository;

  const ledgerRepository = {
    lockWalletByUserCurrency: async (
      context: DrizzleTransactionContext,
      userId: string,
      currency: string,
    ) => lockForTransaction(context, `wallet:${userId}:${currency}`),
    findWalletBalanceByUserCurrencyInTransaction: async () => ({
      walletId: "wallet_1",
      userId: "user_1",
      currency: "USD",
      pendingBalanceMinor: 0n,
      availableBalanceMinor: state.availableBalanceMinor,
      lockedBalanceMinor: state.lockedBalanceMinor,
      reservedBalanceMinor: 0n,
      withdrawnBalanceMinor: 0n,
      lastEntryAt: null,
    }),
    findWalletByUserCurrency: async () => ({ id: "wallet_1", userId: "user_1", currency: "USD" }),
    findWalletAccountByCategory: async (input: { category: string }) => ({
      id: `account_${input.category}`,
      ownerType: "customer",
      ownerId: "user_1",
      accountType: `customer_${input.category}`,
      currency: "USD",
      status: "active",
      createdAt: activationTime,
    }),
    ensureLedgerAccount: async () => ({
      id: "account_platform_roi_expense",
      ownerType: "platform",
      ownerId: "unique_sky_way",
      accountType: "platform_roi_expense",
      currency: "USD",
      status: "active",
      createdAt: activationTime,
    }),
    postLedgerTransaction: async (
      _context: DrizzleTransactionContext,
      input: {
        transaction: Record<string, unknown>;
        entries: Array<Record<string, unknown>>;
      },
    ) => {
      const idempotencyKey = input.transaction.idempotencyKey;
      if (
        typeof idempotencyKey === "string" &&
        state.ledgerTransactions.some(
          (transaction) => transaction.idempotencyKey === idempotencyKey,
        )
      ) {
        throw new UniqueConstraintError("Duplicate ledger idempotency key.");
      }

      const transaction: Record<string, unknown> = {
        id: `ledger_${(state.ledgerTransactionIdSequence += 1)}`,
        ...input.transaction,
      };
      const entries = input.entries.map((entry) => ({
        id: `ledger_entry_${(state.ledgerEntryIdSequence += 1)}`,
        ...entry,
        ledgerTransactionId: transaction.id,
      }));

      applyLedgerProjection(state, transaction["transactionType"] as string, entries);
      state.ledgerTransactions.push(transaction);
      state.ledgerEntries.push(...entries);

      return { transaction, entries };
    },
  } as unknown as LedgerRepository;

  const settlementRepository = {
    findCompletedSettlementRun: async (settlementDate: string, runType: string) =>
      Array.from(state.settlementRuns.values()).find(
        (run) =>
          run.settlementDate === settlementDate &&
          run.runType === runType &&
          run.status === "completed",
      ) ?? null,
    createSettlementRun: async (
      _context: DrizzleTransactionContext,
      values: Record<string, unknown>,
    ) => {
      const activeRun = Array.from(state.settlementRuns.values()).find(
        (run) =>
          run.settlementDate === values.settlementDate &&
          (run.status === "pending" || run.status === "running"),
      );
      if (activeRun) {
        throw new UniqueConstraintError("Duplicate active settlement run.");
      }

      const run = {
        id: `settlement_run_${(state.settlementRunIdSequence += 1)}`,
        ...values,
      };
      state.settlementRuns.set(run.id, run);
      return run;
    },
    markSettlementRunRunning: async (
      _context: DrizzleTransactionContext,
      settlementRunId: string,
      startedAt: Date,
    ) => updateSettlementRun(state, settlementRunId, { status: "running", startedAt }),
    markSettlementRunCompleted: async (
      _context: DrizzleTransactionContext,
      settlementRunId: string,
      completedAt: Date,
    ) => updateSettlementRun(state, settlementRunId, { status: "completed", completedAt }),
    markSettlementRunFailed: async (
      _context: DrizzleTransactionContext,
      settlementRunId: string,
      errorMessage: string,
    ) => updateSettlementRun(state, settlementRunId, { status: "failed", errorMessage }),
    findSettlementItemByInvestmentAndDate: async (investmentId: string, settlementDate: string) =>
      state.settlementItems.get(`${investmentId}:${settlementDate}`) ?? null,
    findSettlementItemByInvestmentAndDateInTransaction: async (
      _context: DrizzleTransactionContext,
      investmentId: string,
      settlementDate: string,
    ) => state.settlementItems.get(`${investmentId}:${settlementDate}`) ?? null,
    sumPostedRoiMinorByInvestment: async (investmentId: string) =>
      sumPostedRoi(state, investmentId),
    sumPostedRoiMinorByInvestmentInTransaction: async (
      _context: DrizzleTransactionContext,
      investmentId: string,
    ) => sumPostedRoi(state, investmentId),
    sumRoiLedgerPostedMinorByInvestment: async (investmentId: string) =>
      state.roiLedgerEntries
        .filter((entry) => entry.investmentId === investmentId && entry.status === "posted")
        .reduce((sum, entry) => sum + (entry.postedRoiMinor as bigint), 0n),
    createSettlementItem: async (
      _context: DrizzleTransactionContext,
      values: Record<string, unknown>,
    ) => {
      const key = `${values.investmentId}:${values.settlementDate}`;
      if (state.settlementItems.has(key)) {
        throw new UniqueConstraintError("Duplicate settlement item.");
      }

      const item = {
        id: `settlement_item_${(state.settlementItemIdSequence += 1)}`,
        ...values,
      };
      state.settlementItems.set(key, item);
      return item;
    },
    createRoiLedgerEntry: async (
      _context: DrizzleTransactionContext,
      values: Record<string, unknown>,
    ) => {
      if (
        state.roiLedgerEntries.some(
          (entry) =>
            entry.investmentId === values.investmentId && entry.earningDate === values.earningDate,
        )
      ) {
        throw new UniqueConstraintError("Duplicate ROI ledger entry.");
      }

      const entry = {
        id: `roi_ledger_${(state.roiLedgerEntryIdSequence += 1)}`,
        ...values,
      };
      state.roiLedgerEntries.push(entry);
      return entry;
    },
  } as unknown as SettlementRepository;

  const service = new InvestmentEngineService({
    clock,
    transactionManager,
    coreRepository,
    investmentRepository,
    ledgerRepository,
    settlementRepository,
  });

  return {
    service,
    state,
    transactionManager,
    ledgerRepository,
    ledgerTransactionsByType: (transactionType: string) =>
      state.ledgerTransactions.filter(
        (transaction) => transaction.transactionType === transactionType,
      ),
    onlyInvestment: () => Array.from(state.investments.values())[0] ?? null,
    seedSettlementRun: (id: string) => {
      state.settlementRuns.set(id, {
        id,
        settlementDate: "2026-07-13",
        runType: "daily",
        status: "running",
      });
    },
    seedActiveInvestment: (overrides: InvestmentOverrides) => {
      const investment = createInvestmentRecord({
        id: "investment_seeded",
        userId: "user_1",
        planVersionId: "plan_version_1",
        currency: "USD",
        principalMinor: 10_000n,
        dailyRoiBps: 100,
        totalRoiBps: 100,
        principalReturnPolicy: "return_at_maturity",
        calculationVersion: "roi-v1",
        idempotencyKey: "seeded",
        status: "active",
        startAt: activationTime,
        activatedAt: activationTime,
        createdAt: activationTime,
        maturedAt: null,
        cancelledAt: null,
        fundingLedgerTransactionId: "ledger_seeded_funding",
        maturityLedgerTransactionId: null,
        roundingResidualMicroMinor: 0n,
        ...overrides,
      });
      state.investments.set(investment.id, investment);
      state.investmentIdsByIdempotencyKey.set("seeded", investment.id);
      state.availableBalanceMinor = 10_000n;
      state.lockedBalanceMinor = 10_000n;
      return investment;
    },
  };
}

function createInvestmentRecord(overrides: Record<string, unknown>): InvestmentRecord {
  return {
    id: "investment_1",
    userId: "user_1",
    planVersionId: "plan_version_1",
    currency: "USD",
    principalMinor: 10_000n,
    dailyRoiBps: 100,
    totalRoiBps: 300,
    promisedRoiMinor: 300n,
    termDays: 3,
    principalReturnPolicy: "return_at_maturity",
    calculationVersion: "roi-v1",
    idempotencyKey: null,
    startAt: null,
    firstSettlementDate: null,
    maturityDate: null,
    status: "pending",
    roundingResidualMicroMinor: 0n,
    createdAt: activationTime,
    activatedAt: null,
    maturedAt: null,
    cancelledAt: null,
    fundingLedgerTransactionId: null,
    maturityLedgerTransactionId: null,
    ...overrides,
  } as InvestmentRecord;
}

function updateInvestment(
  state: ReturnType<typeof createConcurrencyHarness>["state"],
  investmentId: string,
  values: Record<string, unknown>,
) {
  const existing = state.investments.get(investmentId);
  if (!existing) throw new Error(`Missing investment: ${investmentId}`);
  const updated = { ...existing, ...values } as InvestmentRecord;
  state.investments.set(investmentId, updated);
  return updated;
}

function updateSettlementRun(
  state: ReturnType<typeof createConcurrencyHarness>["state"],
  settlementRunId: string,
  values: Record<string, unknown>,
) {
  const existing = state.settlementRuns.get(settlementRunId);
  if (!existing) throw new Error(`Missing settlement run: ${settlementRunId}`);
  const updated = { ...existing, ...values };
  state.settlementRuns.set(settlementRunId, updated);
  return updated;
}

function sumPostedRoi(
  state: ReturnType<typeof createConcurrencyHarness>["state"],
  investmentId: string,
) {
  return Array.from(state.settlementItems.values())
    .filter((item) => item.investmentId === investmentId && item.status === "posted")
    .reduce((sum, item) => sum + (item.postedRoiMinor as bigint), 0n);
}

function applyLedgerProjection(
  state: ReturnType<typeof createConcurrencyHarness>["state"],
  transactionType: string,
  entries: Array<Record<string, unknown>>,
) {
  const amount = entries[0]?.amountMinor as bigint | undefined;
  if (amount === undefined) return;

  if (transactionType === "investment_funding") {
    state.availableBalanceMinor -= amount;
    state.lockedBalanceMinor += amount;
  }
  if (transactionType === "roi_settlement") {
    state.availableBalanceMinor += amount;
  }
  if (transactionType === "maturity_principal_release") {
    state.lockedBalanceMinor -= amount;
    state.availableBalanceMinor += amount;
  }
}

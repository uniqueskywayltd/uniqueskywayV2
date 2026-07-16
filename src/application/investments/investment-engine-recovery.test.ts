import { describe, expect, it } from "vitest";

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

const activationTime = new Date("2026-07-12T16:00:00.000Z");
const settlementClock = new Date("2026-07-14T05:00:00.000Z");

describe("Phase 6.3 investment engine recovery certification", () => {
  it("leaves no durable records when settlement run creation fails", async () => {
    const harness = createRecoveryHarness();
    harness.seedActiveInvestment("investment_1", {
      firstSettlementDate: "2026-07-13",
      maturityDate: "2026-07-15",
      promisedRoiMinor: 300n,
      termDays: 3,
    });
    harness.failures.createSettlementRun = new Error("run creation failed");

    await expect(
      harness.service.runSettlement({
        settlementDate: "2026-07-13",
        runType: "daily",
        lockedBy: "recovery-worker",
      }),
    ).rejects.toThrow("run creation failed");

    expect(harness.state.settlementRuns.size).toBe(0);
    expect(harness.state.settlementItems.size).toBe(0);
    expect(harness.state.roiLedgerEntries).toHaveLength(0);
    expect(harness.state.ledgerTransactions).toHaveLength(0);
  });

  it("marks a run failed when interruption happens after run creation before items", async () => {
    const harness = createRecoveryHarness();
    harness.seedActiveInvestment("investment_1", {
      firstSettlementDate: "2026-07-13",
      maturityDate: "2026-07-15",
      promisedRoiMinor: 300n,
      termDays: 3,
    });
    harness.failures.listActiveInvestments = new Error("investment listing failed");

    await expect(
      harness.service.runSettlement({
        settlementDate: "2026-07-13",
        runType: "daily",
        lockedBy: "recovery-worker",
      }),
    ).rejects.toThrow("investment listing failed");

    expect(harness.runsByStatus("failed")).toHaveLength(1);
    expect(harness.onlyRun()).toEqual(
      expect.objectContaining({
        settlementDate: "2026-07-13",
        runType: "daily",
        status: "failed",
        lockedBy: "recovery-worker",
        errorMessage: "investment listing failed",
      }),
    );
    expect(harness.state.settlementItems.size).toBe(0);
    expect(harness.state.ledgerTransactions).toHaveLength(0);
  });

  it("resumes after one committed investment and continues remaining unsettled investments", async () => {
    const harness = createRecoveryHarness();
    harness.seedActiveInvestment("investment_1", {
      firstSettlementDate: "2026-07-13",
      maturityDate: "2026-07-15",
      promisedRoiMinor: 300n,
      termDays: 3,
    });
    harness.seedActiveInvestment("investment_2", {
      firstSettlementDate: "2026-07-13",
      maturityDate: "2026-07-15",
      promisedRoiMinor: 300n,
      termDays: 3,
    });
    harness.failures.createSettlementItemForInvestmentId = "investment_2";

    await expect(
      harness.service.runSettlement({
        settlementDate: "2026-07-13",
        runType: "daily",
        lockedBy: "first-run",
      }),
    ).rejects.toThrow("settlement item write interrupted");

    expect(harness.runsByStatus("failed")).toHaveLength(1);
    expect(harness.state.settlementItems.size).toBe(1);
    expect(harness.state.settlementItems.has("investment_1:2026-07-13")).toBe(true);
    expect(harness.state.settlementItems.has("investment_2:2026-07-13")).toBe(false);
    expect(harness.ledgerTransactionsByType("roi_settlement")).toHaveLength(1);

    const result = await harness.service.runSettlement({
      settlementDate: "2026-07-13",
      runType: "daily",
      lockedBy: "recovery-run",
    });

    expect(result).toEqual(
      expect.objectContaining({
        processed: 2,
        posted: 1,
        skipped: 1,
      }),
    );
    expect(harness.runsByStatus("completed")).toHaveLength(1);
    expect(harness.state.settlementItems.size).toBe(2);
    expect(harness.ledgerTransactionsByType("roi_settlement")).toHaveLength(2);
    expect(await harness.service.reconcileInvestment("investment_1")).toEqual(
      expect.objectContaining({ passed: true }),
    );
    expect(await harness.service.reconcileInvestment("investment_2")).toEqual(
      expect.objectContaining({ passed: true }),
    );
  });

  it("rolls back partial ROI settlement writes inside a failed item transaction", async () => {
    const harness = createRecoveryHarness();
    harness.seedActiveInvestment("investment_1", {
      firstSettlementDate: "2026-07-13",
      maturityDate: "2026-07-15",
      promisedRoiMinor: 300n,
      termDays: 3,
    });
    harness.failures.createRoiLedgerEntryForInvestmentId = "investment_1";

    await expect(
      harness.service.runSettlement({
        settlementDate: "2026-07-13",
        runType: "daily",
        lockedBy: "rollback-run",
      }),
    ).rejects.toThrow("ROI ledger write interrupted");

    expect(harness.runsByStatus("failed")).toHaveLength(1);
    expect(harness.state.settlementItems.size).toBe(0);
    expect(harness.state.roiLedgerEntries).toHaveLength(0);
    expect(harness.ledgerTransactionsByType("roi_settlement")).toHaveLength(0);
    expect(harness.state.availableBalanceMinor).toBe(10_000n);
    expect(harness.state.lockedBalanceMinor).toBe(10_000n);
  });

  it("rolls back maturity principal release if maturity status update fails", async () => {
    const harness = createRecoveryHarness();
    harness.seedActiveInvestment("investment_1", {
      firstSettlementDate: "2026-07-13",
      maturityDate: "2026-07-13",
      promisedRoiMinor: 100n,
      termDays: 1,
    });
    harness.failures.markInvestmentMaturedForInvestmentId = "investment_1";

    await expect(
      harness.service.runSettlement({
        settlementDate: "2026-07-13",
        runType: "daily",
        lockedBy: "maturity-run",
      }),
    ).rejects.toThrow("maturity update interrupted");

    expect(harness.runsByStatus("failed")).toHaveLength(1);
    expect(harness.state.settlementItems.size).toBe(0);
    expect(harness.state.roiLedgerEntries).toHaveLength(0);
    expect(harness.ledgerTransactionsByType("roi_settlement")).toHaveLength(0);
    expect(harness.ledgerTransactionsByType("maturity_principal_release")).toHaveLength(0);
    expect(harness.onlyInvestment()?.status).toBe("active");
    expect(harness.state.availableBalanceMinor).toBe(10_000n);
    expect(harness.state.lockedBalanceMinor).toBe(10_000n);

    const result = await harness.service.runSettlement({
      settlementDate: "2026-07-13",
      runType: "daily",
      lockedBy: "maturity-recovery-run",
    });

    expect(result.posted).toBe(1);
    expect(harness.ledgerTransactionsByType("roi_settlement")).toHaveLength(1);
    expect(harness.ledgerTransactionsByType("maturity_principal_release")).toHaveLength(1);
    expect(harness.onlyInvestment()?.status).toBe("matured");
    expect(harness.state.availableBalanceMinor).toBe(20_100n);
    expect(harness.state.lockedBalanceMinor).toBe(0n);
  });

  it("recovers after a timeout-like interruption without duplicate financial effects", async () => {
    const harness = createRecoveryHarness();
    harness.seedActiveInvestment("investment_1", {
      firstSettlementDate: "2026-07-13",
      maturityDate: "2026-07-13",
      promisedRoiMinor: 100n,
      termDays: 1,
    });
    harness.failures.createRoiLedgerEntryForInvestmentId = "investment_1";

    await expect(
      harness.service.runSettlement({
        settlementDate: "2026-07-13",
        runType: "daily",
        lockedBy: "timeout-run",
      }),
    ).rejects.toThrow("ROI ledger write interrupted");

    const restartedService = harness.restartService();
    const result = await restartedService.runSettlement({
      settlementDate: "2026-07-13",
      runType: "daily",
      lockedBy: "timeout-recovery-run",
    });

    expect(result.posted).toBe(1);
    expect(harness.runsByStatus("failed")).toHaveLength(1);
    expect(harness.runsByStatus("completed")).toHaveLength(1);
    expect(harness.state.settlementItems.size).toBe(1);
    expect(harness.state.roiLedgerEntries).toHaveLength(1);
    expect(harness.ledgerTransactionsByType("roi_settlement")).toHaveLength(1);
    expect(harness.ledgerTransactionsByType("maturity_principal_release")).toHaveLength(1);
    expect(await restartedService.reconcileInvestment("investment_1")).toEqual(
      expect.objectContaining({ passed: true }),
    );
  });
});

interface RecoveryFailures {
  createSettlementRun?: Error;
  listActiveInvestments?: Error;
  createSettlementItemForInvestmentId?: string;
  createRoiLedgerEntryForInvestmentId?: string;
  markInvestmentMaturedForInvestmentId?: string;
}

interface RecoveryState {
  availableBalanceMinor: bigint;
  lockedBalanceMinor: bigint;
  investments: Map<string, InvestmentRecord>;
  investmentIdsByIdempotencyKey: Map<string, string>;
  settlementRuns: Map<string, Record<string, unknown>>;
  settlementItems: Map<string, Record<string, unknown>>;
  roiLedgerEntries: Array<Record<string, unknown>>;
  ledgerTransactions: Array<Record<string, unknown>>;
  ledgerEntries: Array<Record<string, unknown>>;
  roiScheduleItems: Array<Record<string, unknown>>;
  transactionIdSequence: number;
  settlementRunIdSequence: number;
  settlementItemIdSequence: number;
  ledgerTransactionIdSequence: number;
  ledgerEntryIdSequence: number;
  roiLedgerEntryIdSequence: number;
}

function createRecoveryHarness() {
  const failures: RecoveryFailures = {};
  const state: RecoveryState = {
    availableBalanceMinor: 10_000n,
    lockedBalanceMinor: 0n,
    investments: new Map(),
    investmentIdsByIdempotencyKey: new Map(),
    settlementRuns: new Map(),
    settlementItems: new Map(),
    roiLedgerEntries: [],
    ledgerTransactions: [],
    ledgerEntries: [],
    roiScheduleItems: [],
    transactionIdSequence: 0,
    settlementRunIdSequence: 0,
    settlementItemIdSequence: 0,
    ledgerTransactionIdSequence: 0,
    ledgerEntryIdSequence: 0,
    roiLedgerEntryIdSequence: 0,
  };
  const clock: Clock = { now: () => settlementClock };
  const transactionManager = {
    runInTransaction: async <TResult>(
      work: (context: DrizzleTransactionContext) => Promise<TResult>,
    ) => {
      const snapshot = snapshotState(state);
      const context = {
        db: {},
        transactionId: `tx_${(state.transactionIdSequence += 1)}`,
      } as unknown as DrizzleTransactionContext;

      try {
        return await work(context);
      } catch (error) {
        restoreState(state, snapshot);
        throw error;
      }
    },
  } as DrizzleTransactionManager;

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
      findInvestmentByIdempotencyKey(state, idempotencyKey),
    findInvestmentByIdempotencyKeyInTransaction: async (
      _context: DrizzleTransactionContext,
      idempotencyKey: string,
    ) => findInvestmentByIdempotencyKey(state, idempotencyKey),
    findInvestmentById: async (id: string) => state.investments.get(id) ?? null,
    lockInvestmentById: async (_context: DrizzleTransactionContext, investmentId: string) =>
      state.investments.get(investmentId) ?? null,
    createInvestment: async (
      _context: DrizzleTransactionContext,
      values: Record<string, unknown>,
    ) => {
      const id = `investment_${state.investments.size + 1}`;
      const investment = createInvestmentRecord(id, {
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
      if (typeof values.idempotencyKey === "string") {
        state.investmentIdsByIdempotencyKey.set(values.idempotencyKey, id);
      }
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
    listActiveInvestmentsEligibleForSettlement: async (settlementDate: string) => {
      if (failures.listActiveInvestments) {
        const failure = failures.listActiveInvestments;
        delete failures.listActiveInvestments;
        throw failure;
      }

      return Array.from(state.investments.values()).filter(
        (investment) =>
          investment.status === "active" &&
          investment.firstSettlementDate !== null &&
          investment.maturityDate !== null &&
          investment.firstSettlementDate <= settlementDate &&
          investment.maturityDate >= settlementDate,
      );
    },
    updateInvestmentResidual: async (
      _context: DrizzleTransactionContext,
      investmentId: string,
      roundingResidualMicroMinor: bigint,
    ) => updateInvestment(state, investmentId, { roundingResidualMicroMinor }),
    markInvestmentMatured: async (
      _context: DrizzleTransactionContext,
      investmentId: string,
      values: Record<string, unknown>,
    ) => {
      if (failures.markInvestmentMaturedForInvestmentId === investmentId) {
        delete failures.markInvestmentMaturedForInvestmentId;
        throw new Error("maturity update interrupted");
      }

      return updateInvestment(state, investmentId, { status: "matured", ...values });
    },
    markInvestmentMaturing: async (
      _context: DrizzleTransactionContext,
      investmentId: string,
      roundingResidualMicroMinor: bigint,
    ) => updateInvestment(state, investmentId, { status: "maturing", roundingResidualMicroMinor }),
    markRoiScheduleItemPosted: async () => ({ id: "schedule_posted" }),
  } as unknown as InvestmentRepository;

  const ledgerRepository = {
    lockWalletByUserCurrency: async () => undefined,
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
      if (failures.createSettlementRun) {
        const failure = failures.createSettlementRun;
        delete failures.createSettlementRun;
        throw failure;
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
      if (failures.createSettlementItemForInvestmentId === values.investmentId) {
        delete failures.createSettlementItemForInvestmentId;
        throw new Error("settlement item write interrupted");
      }

      const item = {
        id: `settlement_item_${(state.settlementItemIdSequence += 1)}`,
        ...values,
      };
      state.settlementItems.set(`${values.investmentId}:${values.settlementDate}`, item);
      return item;
    },
    createRoiLedgerEntry: async (
      _context: DrizzleTransactionContext,
      values: Record<string, unknown>,
    ) => {
      if (failures.createRoiLedgerEntryForInvestmentId === values.investmentId) {
        delete failures.createRoiLedgerEntryForInvestmentId;
        throw new Error("ROI ledger write interrupted");
      }
      const entry = {
        id: `roi_ledger_${(state.roiLedgerEntryIdSequence += 1)}`,
        ...values,
      };
      state.roiLedgerEntries.push(entry);
      return entry;
    },
  } as unknown as SettlementRepository;

  const buildService = () =>
    new InvestmentEngineService({
      clock,
      transactionManager,
      coreRepository,
      investmentRepository,
      ledgerRepository,
      settlementRepository,
    });

  return {
    service: buildService(),
    restartService: buildService,
    state,
    failures,
    onlyRun: () => Array.from(state.settlementRuns.values())[0] ?? null,
    onlyInvestment: () => Array.from(state.investments.values())[0] ?? null,
    runsByStatus: (status: string) =>
      Array.from(state.settlementRuns.values()).filter((run) => run.status === status),
    ledgerTransactionsByType: (transactionType: string) =>
      state.ledgerTransactions.filter(
        (transaction) => transaction.transactionType === transactionType,
      ),
    seedActiveInvestment: (id: string, overrides: InvestmentOverrides) => {
      const investment = createInvestmentRecord(id, {
        userId: "user_1",
        planVersionId: "plan_version_1",
        currency: "USD",
        principalMinor: 10_000n,
        dailyRoiBps: 100,
        totalRoiBps: overrides.promisedRoiMinor === null ? null : 300,
        principalReturnPolicy: "return_at_maturity",
        calculationVersion: "roi-v1",
        idempotencyKey: id,
        status: "active",
        startAt: activationTime,
        activatedAt: activationTime,
        createdAt: activationTime,
        maturedAt: null,
        cancelledAt: null,
        fundingLedgerTransactionId: `ledger_${id}_funding`,
        maturityLedgerTransactionId: null,
        roundingResidualMicroMinor: 0n,
        ...overrides,
      });
      state.investments.set(id, investment);
      state.investmentIdsByIdempotencyKey.set(id, id);
      state.lockedBalanceMinor += investment.principalMinor;
      return investment;
    },
  };
}

interface InvestmentOverrides {
  firstSettlementDate: string;
  maturityDate: string;
  promisedRoiMinor: bigint | null;
  termDays: number;
}

function createInvestmentRecord(id: string, overrides: Record<string, unknown>): InvestmentRecord {
  return {
    id,
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
    idempotencyKey: id,
    startAt: activationTime,
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

function findInvestmentByIdempotencyKey(state: RecoveryState, idempotencyKey: string) {
  const investmentId = state.investmentIdsByIdempotencyKey.get(idempotencyKey);
  return investmentId ? (state.investments.get(investmentId) ?? null) : null;
}

function updateInvestment(
  state: RecoveryState,
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
  state: RecoveryState,
  settlementRunId: string,
  values: Record<string, unknown>,
) {
  const existing = state.settlementRuns.get(settlementRunId);
  if (!existing) throw new Error(`Missing settlement run: ${settlementRunId}`);
  const updated = { ...existing, ...values };
  state.settlementRuns.set(settlementRunId, updated);
  return updated;
}

function sumPostedRoi(state: RecoveryState, investmentId: string) {
  return Array.from(state.settlementItems.values())
    .filter((item) => item.investmentId === investmentId && item.status === "posted")
    .reduce((sum, item) => sum + (item.postedRoiMinor as bigint), 0n);
}

function applyLedgerProjection(
  state: RecoveryState,
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

function snapshotState(state: RecoveryState): RecoveryState {
  return {
    availableBalanceMinor: state.availableBalanceMinor,
    lockedBalanceMinor: state.lockedBalanceMinor,
    investments: new Map(state.investments),
    investmentIdsByIdempotencyKey: new Map(state.investmentIdsByIdempotencyKey),
    settlementRuns: new Map(state.settlementRuns),
    settlementItems: new Map(state.settlementItems),
    roiLedgerEntries: [...state.roiLedgerEntries],
    ledgerTransactions: [...state.ledgerTransactions],
    ledgerEntries: [...state.ledgerEntries],
    roiScheduleItems: [...state.roiScheduleItems],
    transactionIdSequence: state.transactionIdSequence,
    settlementRunIdSequence: state.settlementRunIdSequence,
    settlementItemIdSequence: state.settlementItemIdSequence,
    ledgerTransactionIdSequence: state.ledgerTransactionIdSequence,
    ledgerEntryIdSequence: state.ledgerEntryIdSequence,
    roiLedgerEntryIdSequence: state.roiLedgerEntryIdSequence,
  };
}

function restoreState(state: RecoveryState, snapshot: RecoveryState) {
  state.availableBalanceMinor = snapshot.availableBalanceMinor;
  state.lockedBalanceMinor = snapshot.lockedBalanceMinor;
  state.investments = new Map(snapshot.investments);
  state.investmentIdsByIdempotencyKey = new Map(snapshot.investmentIdsByIdempotencyKey);
  state.settlementRuns = new Map(snapshot.settlementRuns);
  state.settlementItems = new Map(snapshot.settlementItems);
  state.roiLedgerEntries = [...snapshot.roiLedgerEntries];
  state.ledgerTransactions = [...snapshot.ledgerTransactions];
  state.ledgerEntries = [...snapshot.ledgerEntries];
  state.roiScheduleItems = [...snapshot.roiScheduleItems];
  state.transactionIdSequence = snapshot.transactionIdSequence;
  state.settlementRunIdSequence = snapshot.settlementRunIdSequence;
  state.settlementItemIdSequence = snapshot.settlementItemIdSequence;
  state.ledgerTransactionIdSequence = snapshot.ledgerTransactionIdSequence;
  state.ledgerEntryIdSequence = snapshot.ledgerEntryIdSequence;
  state.roiLedgerEntryIdSequence = snapshot.roiLedgerEntryIdSequence;
}

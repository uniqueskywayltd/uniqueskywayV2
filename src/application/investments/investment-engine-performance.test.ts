import { performance } from "node:perf_hooks";

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

describe("Phase 6.4 investment engine performance certification", () => {
  it("meets service-work latency targets without database or network latency", async () => {
    const activationHarness = createPerformanceHarness();
    const activation = await measure(() =>
      activationHarness.service.activateInvestment({
        userId: "user_1",
        planVersionId: "plan_version_1",
        principalMinor: 10_000n,
        idempotencyKey: "activation:performance",
        activatedAt: activationTime,
      }),
    );

    const singleSettlementHarness = createPerformanceHarness();
    singleSettlementHarness.seedActiveInvestments(1);
    const singleSettlement = await measure(() =>
      singleSettlementHarness.service.runSettlement({
        settlementDate: "2026-07-13",
        runType: "daily",
        lockedBy: "performance-single",
      }),
    );

    const batchSettlementHarness = createPerformanceHarness();
    batchSettlementHarness.seedActiveInvestments(10_000);
    const batchSettlement = await measure(() =>
      batchSettlementHarness.service.runSettlement({
        settlementDate: "2026-07-13",
        runType: "daily",
        lockedBy: "performance-batch",
      }),
    );

    expect(activation.elapsedMs).toBeLessThan(100);
    expect(singleSettlement.elapsedMs).toBeLessThan(50);
    expect(batchSettlement.elapsedMs).toBeLessThan(300_000);
    expect(batchSettlement.result.processed).toBe(10_000);
    expect(batchSettlement.result.posted).toBe(10_000);
    expect(batchSettlementHarness.state.settlementItems.size).toBe(10_000);
    expect(batchSettlementHarness.state.roiLedgerEntries).toHaveLength(10_000);
  }, 300_000);
});

interface PerformanceState {
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
  investmentIdSequence: number;
  settlementRunIdSequence: number;
  settlementItemIdSequence: number;
  ledgerTransactionIdSequence: number;
  ledgerEntryIdSequence: number;
  roiLedgerEntryIdSequence: number;
}

function createPerformanceHarness() {
  const state: PerformanceState = {
    availableBalanceMinor: 1_000_000_000n,
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
    investmentIdSequence: 0,
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
    ) =>
      work({
        db: {},
        transactionId: `tx_${(state.transactionIdSequence += 1)}`,
      } as unknown as DrizzleTransactionContext),
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
    lockInvestmentById: async () => null,
    createInvestment: async (
      _context: DrizzleTransactionContext,
      values: Record<string, unknown>,
    ) => {
      const id = `investment_${(state.investmentIdSequence += 1)}`;
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
    seedActiveInvestments: (count: number) => {
      for (let index = 1; index <= count; index += 1) {
        const id = `investment_${index}`;
        const investment = createInvestmentRecord(id, {
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
          status: "active",
          startAt: activationTime,
          firstSettlementDate: "2026-07-13",
          maturityDate: "2026-07-15",
          activatedAt: activationTime,
          createdAt: activationTime,
          maturedAt: null,
          cancelledAt: null,
          fundingLedgerTransactionId: `ledger_${id}_funding`,
          maturityLedgerTransactionId: null,
          roundingResidualMicroMinor: 0n,
        });
        state.investments.set(id, investment);
        state.investmentIdsByIdempotencyKey.set(id, id);
        state.lockedBalanceMinor += investment.principalMinor;
      }
    },
  };
}

async function measure<TResult>(work: () => Promise<TResult>) {
  const startedAt = performance.now();
  const result = await work();
  const elapsedMs = performance.now() - startedAt;

  return { elapsedMs, result };
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

function findInvestmentByIdempotencyKey(state: PerformanceState, idempotencyKey: string) {
  const investmentId = state.investmentIdsByIdempotencyKey.get(idempotencyKey);
  return investmentId ? (state.investments.get(investmentId) ?? null) : null;
}

function updateInvestment(
  state: PerformanceState,
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
  state: PerformanceState,
  settlementRunId: string,
  values: Record<string, unknown>,
) {
  const existing = state.settlementRuns.get(settlementRunId);
  if (!existing) throw new Error(`Missing settlement run: ${settlementRunId}`);
  const updated = { ...existing, ...values };
  state.settlementRuns.set(settlementRunId, updated);
  return updated;
}

function sumPostedRoi(state: PerformanceState, investmentId: string) {
  return Array.from(state.settlementItems.values())
    .filter((item) => item.investmentId === investmentId && item.status === "posted")
    .reduce((sum, item) => sum + (item.postedRoiMinor as bigint), 0n);
}

function applyLedgerProjection(
  state: PerformanceState,
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

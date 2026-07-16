import { describe, expect, it, vi } from "vitest";

import { AppError } from "@/application/errors";
import type { Clock } from "@/application/ports";
import type {
  CoreRepository,
  DrizzleTransactionContext,
  DrizzleTransactionManager,
  InvestmentRepository,
  LedgerRepository,
  SettlementRepository,
} from "@/infrastructure/database";

import { InvestmentEngineService } from "./investment-engine-service";

const tx = { db: {}, transactionId: "tx_investment_engine" } as DrizzleTransactionContext;
const now = new Date("2026-07-14T05:00:00.000Z");
const activationTime = new Date("2026-07-12T16:00:00.000Z");

describe("InvestmentEngineService", () => {
  it("activates an investment by locking principal and snapshotting plan terms", async () => {
    const { service, fakes } = createService();

    const result = await service.activateInvestment({
      userId: "user_1",
      planVersionId: "plan_version_1",
      principalMinor: 10_000n,
      idempotencyKey: "activate:user_1:plan_version_1:10000",
      activatedAt: activationTime,
    });

    expect(result.idempotent).toBe(false);
    expect(result.investment.status).toBe("active");
    expect(fakes.ledgerRepository.lockWalletByUserCurrency).toHaveBeenCalledWith(
      tx,
      "user_1",
      "USD",
    );
    expect(fakes.investmentRepository.createInvestment).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        dailyRoiBps: 100,
        totalRoiBps: 300,
        promisedRoiMinor: 300n,
        principalReturnPolicy: "return_at_maturity",
        calculationVersion: "roi-v1",
      }),
    );
    expect(fakes.ledgerRepository.postLedgerTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        transaction: expect.objectContaining({ transactionType: "investment_funding" }),
        entries: [
          expect.objectContaining({ direction: "debit", amountMinor: 10_000n }),
          expect.objectContaining({ direction: "credit", amountMinor: 10_000n }),
        ],
      }),
    );
    expect(fakes.investmentRepository.createRoiScheduleItem).toHaveBeenCalledTimes(3);
    expect(fakes.investmentRepository.updateInvestmentActivation).toHaveBeenCalledWith(
      tx,
      "investment_1",
      expect.objectContaining({
        firstSettlementDate: "2026-07-13",
        maturityDate: "2026-07-15",
      }),
    );
  });

  it("returns the existing investment for repeated activation idempotency keys", async () => {
    const { service, fakes } = createService({
      existingInvestment: createInvestmentRecord({ id: "investment_existing" }),
    });

    const result = await service.activateInvestment({
      userId: "user_1",
      planVersionId: "plan_version_1",
      principalMinor: 10_000n,
      idempotencyKey: "existing-key",
      activatedAt: activationTime,
    });

    expect(result.idempotent).toBe(true);
    expect(result.investment.id).toBe("investment_existing");
    expect(fakes.transactionManager.runInTransaction).not.toHaveBeenCalled();
  });

  it("rejects activation when available balance is insufficient", async () => {
    const { service, fakes } = createService({ availableBalanceMinor: 9_999n });

    await expect(
      service.activateInvestment({
        userId: "user_1",
        planVersionId: "plan_version_1",
        principalMinor: 10_000n,
        idempotencyKey: "insufficient",
        activatedAt: activationTime,
      }),
    ).rejects.toThrow(AppError);

    expect(fakes.ledgerRepository.postLedgerTransaction).not.toHaveBeenCalled();
    expect(fakes.investmentRepository.createInvestment).not.toHaveBeenCalled();
  });

  it("settles ROI, records ROI ledger details, and releases principal at maturity", async () => {
    const investment = createInvestmentRecord({
      firstSettlementDate: "2026-07-13",
      maturityDate: "2026-07-13",
      promisedRoiMinor: 100n,
    });
    const { service, fakes } = createService({ activeInvestments: [investment] });

    const result = await service.runSettlement({
      settlementDate: "2026-07-13",
      runType: "daily",
      lockedBy: "test-runner",
    });

    expect(result).toEqual(
      expect.objectContaining({
        settlementRunId: "settlement_run_1",
        settlementDate: "2026-07-13",
        processed: 1,
        posted: 1,
        skipped: 0,
      }),
    );
    expect(fakes.settlementRepository.createSettlementItem).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        earningDate: "2026-07-13",
        postedRoiMinor: 100n,
        nextResidualMicroMinor: 0n,
        status: "posted",
      }),
    );
    expect(fakes.settlementRepository.createRoiLedgerEntry).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        principalMinor: 10_000n,
        dailyRoiBps: 100,
        postedRoiMinor: 100n,
        calculationVersion: "roi-v1",
      }),
    );
    expect(fakes.investmentRepository.markInvestmentMatured).toHaveBeenCalledWith(
      tx,
      "investment_1",
      expect.objectContaining({
        maturityLedgerTransactionId: "ledger_maturity_principal_release",
        roundingResidualMicroMinor: 0n,
      }),
    );
  });

  it("treats repeated completed settlement runs as idempotent no-ops", async () => {
    const { service, fakes } = createService({
      completedSettlementRun: { id: "settlement_run_completed" },
    });

    const result = await service.runSettlement({
      settlementDate: "2026-07-13",
      runType: "daily",
      lockedBy: "test-runner",
    });

    expect(result).toEqual({
      settlementRunId: "settlement_run_completed",
      settlementDate: "2026-07-13",
      processed: 0,
      posted: 0,
      skipped: 0,
      idempotent: true,
    });
    expect(fakes.settlementRepository.createSettlementRun).not.toHaveBeenCalled();
  });

  it("skips an investment already settled inside the settlement transaction", async () => {
    const investment = createInvestmentRecord({ firstSettlementDate: "2026-07-13" });
    const { service, fakes } = createService({
      activeInvestments: [investment],
      existingSettlementItem: { id: "settlement_item_existing" },
    });

    const result = await service.runSettlement({
      settlementDate: "2026-07-13",
      runType: "daily",
      lockedBy: "test-runner",
    });

    expect(result).toEqual(
      expect.objectContaining({
        processed: 1,
        posted: 0,
        skipped: 1,
      }),
    );
    expect(fakes.investmentRepository.lockInvestmentById).toHaveBeenCalledWith(tx, investment.id);
    expect(
      fakes.settlementRepository.findSettlementItemByInvestmentAndDateInTransaction,
    ).toHaveBeenCalledWith(tx, investment.id, "2026-07-13");
    expect(fakes.ledgerRepository.postLedgerTransaction).not.toHaveBeenCalled();
  });
});

function createService(options: CreateServiceOptions = {}) {
  const planVersion = {
    id: "plan_version_1",
    planId: "plan_1",
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
  };
  const investment = createInvestmentRecord();
  const fakes = {
    clock: {
      now: vi.fn(() => now),
    },
    transactionManager: {
      runInTransaction: vi.fn(async (work: (context: DrizzleTransactionContext) => unknown) =>
        work(tx),
      ),
    },
    coreRepository: {
      findInvestmentPlanVersionById: vi.fn(async () => planVersion),
      findInvestmentPlanById: vi.fn(async () => ({ id: "plan_1", name: "Silver" })),
      findCustomerPreferencesByUserId: vi.fn(async () => null),
      findCustomerProfileByUserId: vi.fn(async () => null),
    },
    investmentRepository: {
      findInvestmentByIdempotencyKey: vi.fn(async () => options.existingInvestment ?? null),
      findInvestmentByIdempotencyKeyInTransaction: vi.fn(async () => null),
      findInvestmentById: vi.fn(async () => investment),
      lockInvestmentById: vi.fn(async () => investment),
      createInvestment: vi.fn(async (_context: DrizzleTransactionContext, values: object) => ({
        ...investment,
        ...values,
        id: "investment_1",
        status: "pending",
      })),
      updateInvestmentActivation: vi.fn(
        async (_context: DrizzleTransactionContext, _id: string, values: object) => ({
          ...investment,
          ...values,
        }),
      ),
      createRoiScheduleItem: vi.fn(async () => ({ id: "schedule_item_1" })),
      listActiveInvestmentsEligibleForSettlement: vi.fn(
        async () => options.activeInvestments ?? [],
      ),
      updateInvestmentResidual: vi.fn(async () => investment),
      markRoiScheduleItemPosted: vi.fn(async () => ({ id: "schedule_item_1" })),
      markInvestmentMatured: vi.fn(async () => ({ ...investment, status: "matured" })),
      markInvestmentMaturing: vi.fn(async () => ({ ...investment, status: "maturing" })),
    },
    ledgerRepository: {
      lockWalletByUserCurrency: vi.fn(async () => undefined),
      findWalletBalanceByUserCurrencyInTransaction: vi.fn(async () => ({
        walletId: "wallet_1",
        userId: "user_1",
        currency: "USD",
        pendingBalanceMinor: 0n,
        availableBalanceMinor: options.availableBalanceMinor ?? 20_000n,
        lockedBalanceMinor: 0n,
        reservedBalanceMinor: 0n,
        withdrawnBalanceMinor: 0n,
        lastEntryAt: null,
      })),
      findWalletByUserCurrency: vi.fn(async () => ({ id: "wallet_1" })),
      findWalletAccountByCategory: vi.fn(async (input: { category: string }) => ({
        id: `account_${input.category}`,
        accountType: `customer_${input.category}`,
        currency: "USD",
      })),
      ensureLedgerAccount: vi.fn(async () => ({
        id: "account_platform_roi_expense",
        currency: "USD",
      })),
      postLedgerTransaction: vi.fn(async (_context: DrizzleTransactionContext, input) => ({
        transaction: {
          id: `ledger_${input.transaction.transactionType}`,
          transactionType: input.transaction.transactionType,
        },
        entries: input.entries,
      })),
    },
    settlementRepository: {
      findCompletedSettlementRun: vi.fn(async () => options.completedSettlementRun ?? null),
      createSettlementRun: vi.fn(async () => ({ id: "settlement_run_1" })),
      markSettlementRunRunning: vi.fn(async () => ({ id: "settlement_run_1" })),
      markSettlementRunCompleted: vi.fn(async () => ({ id: "settlement_run_1" })),
      markSettlementRunFailed: vi.fn(async () => ({ id: "settlement_run_1" })),
      findSettlementItemByInvestmentAndDate: vi.fn(async () => null),
      findSettlementItemByInvestmentAndDateInTransaction: vi.fn(
        async () => options.existingSettlementItem ?? null,
      ),
      sumPostedRoiMinorByInvestment: vi.fn(async () => 0n),
      sumPostedRoiMinorByInvestmentInTransaction: vi.fn(async () => 0n),
      sumRoiLedgerPostedMinorByInvestment: vi.fn(async () => 0n),
      createSettlementItem: vi.fn(async () => ({ id: "settlement_item_1" })),
      createRoiLedgerEntry: vi.fn(async () => ({ id: "roi_ledger_1" })),
    },
  };

  return {
    service: new InvestmentEngineService({
      clock: fakes.clock as unknown as Clock,
      transactionManager: fakes.transactionManager as unknown as DrizzleTransactionManager,
      coreRepository: fakes.coreRepository as unknown as CoreRepository,
      investmentRepository: fakes.investmentRepository as unknown as InvestmentRepository,
      ledgerRepository: fakes.ledgerRepository as unknown as LedgerRepository,
      settlementRepository: fakes.settlementRepository as unknown as SettlementRepository,
    }),
    fakes,
  };
}

interface CreateServiceOptions {
  availableBalanceMinor?: bigint;
  existingInvestment?: ReturnType<typeof createInvestmentRecord>;
  activeInvestments?: Array<ReturnType<typeof createInvestmentRecord>>;
  completedSettlementRun?: { id: string };
  existingSettlementItem?: { id: string };
}

function createInvestmentRecord(overrides: Record<string, unknown> = {}) {
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
    idempotencyKey: "investment-key",
    startAt: activationTime,
    firstSettlementDate: "2026-07-13",
    maturityDate: "2026-07-15",
    status: "active",
    roundingResidualMicroMinor: 0n,
    createdAt: activationTime,
    activatedAt: activationTime,
    maturedAt: null,
    cancelledAt: null,
    fundingLedgerTransactionId: "ledger_investment_funding",
    maturityLedgerTransactionId: null,
    ...overrides,
  };
}

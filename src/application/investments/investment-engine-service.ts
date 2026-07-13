import "server-only";

import { AppError } from "@/application/errors";
import type { Clock } from "@/application/ports";
import {
  calculateDailyRoi,
  calculateLiveEarnings,
  calculatePromisedRoiMinor,
  generateRoiSchedule,
} from "@/domains/investments";
import {
  assertBalancedLedgerPosting,
  createInvestmentFundingEntries,
  createMaturityPrincipalReleaseEntries,
  createRoiSettlementEntries,
} from "@/domains/ledger";
import {
  firstSettlementDate,
  isCompletedSettlementDate,
  maturityDate,
  reconcileInvestment,
} from "@/domains/settlement";
import type {
  CoreRepository,
  DrizzleTransactionContext,
  DrizzleTransactionManager,
  InvestmentRecord,
  InvestmentRepository,
  LedgerAccountRecord,
  LedgerRepository,
  SettlementRepository,
} from "@/infrastructure/database";

export interface InvestmentEngineServiceDependencies {
  clock: Clock;
  transactionManager: DrizzleTransactionManager;
  coreRepository: CoreRepository;
  investmentRepository: InvestmentRepository;
  ledgerRepository: LedgerRepository;
  settlementRepository: SettlementRepository;
}

export interface ActivateInvestmentInput {
  userId: string;
  planVersionId: string;
  principalMinor: bigint;
  idempotencyKey: string;
  activatedAt?: Date;
}

export interface RunSettlementInput {
  settlementDate: string;
  runType: "daily" | "catch_up" | "manual_replay";
  lockedBy: string;
}

export interface LiveEarningsInput {
  investmentId: string;
  now?: Date;
}

export class InvestmentEngineService {
  constructor(private readonly deps: InvestmentEngineServiceDependencies) {}

  async activateInvestment(input: ActivateInvestmentInput) {
    const existing = await this.deps.investmentRepository.findInvestmentByIdempotencyKey(
      input.idempotencyKey,
    );
    if (existing) {
      return { investment: existing, idempotent: true };
    }

    const planVersion = await this.deps.coreRepository.findInvestmentPlanVersionById(
      input.planVersionId,
    );
    if (!planVersion) {
      throw new AppError({ code: "NOT_FOUND", message: "Investment plan version was not found." });
    }

    const activatedAt = input.activatedAt ?? this.deps.clock.now();
    validatePlanVersion(planVersion, input.principalMinor, activatedAt);
    const firstEligibleDate = firstSettlementDate(activatedAt);
    const finalEarningDate = maturityDate(firstEligibleDate, planVersion.termDays);
    const promisedRoiMinor = calculatePromisedRoiMinor({
      principalMinor: input.principalMinor,
      totalRoiBps: planVersion.totalRoiBps,
    });

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.deps.ledgerRepository.lockWalletByUserCurrency(
        tx,
        input.userId,
        planVersion.currency,
      );
      const existingInTransaction =
        await this.deps.investmentRepository.findInvestmentByIdempotencyKeyInTransaction(
          tx,
          input.idempotencyKey,
        );
      if (existingInTransaction) {
        return { investment: existingInTransaction, idempotent: true };
      }

      const balance = await this.deps.ledgerRepository.findWalletBalanceByUserCurrencyInTransaction(
        tx,
        input.userId,
        planVersion.currency,
      );
      if (!balance) {
        throw new AppError({ code: "INVALID_STATE", message: "Customer wallet was not found." });
      }
      if (balance.availableBalanceMinor < input.principalMinor) {
        throw new AppError({
          code: "INVALID_STATE",
          message: "Available balance is insufficient for investment activation.",
        });
      }

      const [availableAccount, lockedAccount] = await Promise.all([
        this.requireWalletAccount(balance.walletId, "available"),
        this.requireWalletAccount(balance.walletId, "locked"),
      ]);

      const investment = await this.deps.investmentRepository.createInvestment(tx, {
        userId: input.userId,
        planVersionId: planVersion.id,
        currency: planVersion.currency,
        principalMinor: input.principalMinor,
        dailyRoiBps: planVersion.dailyRoiBps,
        totalRoiBps: planVersion.totalRoiBps,
        promisedRoiMinor,
        termDays: planVersion.termDays,
        principalReturnPolicy: planVersion.principalReturnPolicy,
        calculationVersion: "roi-v1",
        idempotencyKey: input.idempotencyKey,
        status: "pending",
      });

      const fundingEntries = createInvestmentFundingEntries({
        availableAccountId: availableAccount.id,
        lockedAccountId: lockedAccount.id,
        amountMinor: input.principalMinor,
        currency: planVersion.currency,
      });
      assertBalancedLedgerPosting({ entries: fundingEntries });

      const fundingLedger = await this.deps.ledgerRepository.postLedgerTransaction(tx, {
        transaction: {
          transactionType: "investment_funding",
          idempotencyKey: `investment_funding:${input.idempotencyKey}`,
          referenceType: "investment",
          referenceId: investment.id,
          description: "Investment principal lock",
          metadata: {
            invariantIds: ["FI-401", "FI-402", "FI-105"],
            planVersionId: planVersion.id,
          },
        },
        entries: fundingEntries,
      });

      for (const scheduleItem of generateRoiSchedule({
        investmentId: investment.id,
        principalMinor: input.principalMinor,
        dailyRoiBps: planVersion.dailyRoiBps,
        firstSettlementDate: firstEligibleDate,
        termDays: planVersion.termDays,
      })) {
        await this.deps.investmentRepository.createRoiScheduleItem(tx, scheduleItem);
      }

      const activatedInvestment = await this.deps.investmentRepository.updateInvestmentActivation(
        tx,
        investment.id,
        {
          status: "active",
          startAt: activatedAt,
          activatedAt,
          firstSettlementDate: firstEligibleDate,
          maturityDate: finalEarningDate,
          fundingLedgerTransactionId: fundingLedger.transaction.id,
        },
      );

      return { investment: activatedInvestment, idempotent: false };
    });
  }

  async runSettlement(input: RunSettlementInput) {
    const now = this.deps.clock.now();
    if (!isCompletedSettlementDate(input.settlementDate, now)) {
      throw new AppError({
        code: "INVALID_STATE",
        message: "Settlement date must be a completed New York day.",
      });
    }

    const completedRun = await this.deps.settlementRepository.findCompletedSettlementRun(
      input.settlementDate,
      input.runType,
    );
    if (completedRun) {
      return {
        settlementRunId: completedRun.id,
        settlementDate: input.settlementDate,
        processed: 0,
        posted: 0,
        skipped: 0,
        idempotent: true,
      };
    }

    const run = await this.deps.transactionManager.runInTransaction(async (tx) => {
      const createdRun = await this.deps.settlementRepository.createSettlementRun(tx, {
        settlementDate: input.settlementDate,
        runType: input.runType,
        status: "pending",
        lockedBy: input.lockedBy,
      });

      return this.deps.settlementRepository.markSettlementRunRunning(
        tx,
        createdRun.id,
        this.deps.clock.now(),
      );
    });

    const itemResults: Array<{ investmentId: string; status: "posted" | "skipped" }> = [];

    try {
      const investments =
        await this.deps.investmentRepository.listActiveInvestmentsEligibleForSettlement(
          input.settlementDate,
        );

      for (const investment of investments) {
        const result = await this.settleInvestment(run.id, investment, input.settlementDate);
        itemResults.push(result);
      }

      await this.deps.transactionManager.runInTransaction(async (tx) => {
        await this.deps.settlementRepository.markSettlementRunCompleted(
          tx,
          run.id,
          this.deps.clock.now(),
        );
      });
    } catch (error) {
      await this.deps.transactionManager.runInTransaction(async (tx) => {
        await this.deps.settlementRepository.markSettlementRunFailed(
          tx,
          run.id,
          error instanceof Error ? error.message : "Settlement failed.",
        );
      });
      throw error;
    }

    return {
      settlementRunId: run.id,
      settlementDate: input.settlementDate,
      processed: itemResults.length,
      posted: itemResults.filter((result) => result.status === "posted").length,
      skipped: itemResults.filter((result) => result.status === "skipped").length,
    };
  }

  async calculateLiveEarnings(input: LiveEarningsInput) {
    const investment = await this.deps.investmentRepository.findInvestmentById(input.investmentId);
    if (!investment) {
      throw new AppError({ code: "NOT_FOUND", message: "Investment was not found." });
    }
    if (!investment.firstSettlementDate || !investment.maturityDate) {
      throw new AppError({ code: "INVALID_STATE", message: "Investment is not active." });
    }

    return calculateLiveEarnings({
      principalMinor: investment.principalMinor,
      dailyRoiBps: investment.dailyRoiBps,
      firstSettlementDate: investment.firstSettlementDate,
      maturityDate: investment.maturityDate,
      now: input.now ?? this.deps.clock.now(),
      settledThroughDate: null,
    });
  }

  async reconcileInvestment(investmentId: string) {
    const investment = await this.deps.investmentRepository.findInvestmentById(investmentId);
    if (!investment) {
      throw new AppError({ code: "NOT_FOUND", message: "Investment was not found." });
    }

    const [settlementPostedRoiMinor, roiLedgerPostedRoiMinor] = await Promise.all([
      this.deps.settlementRepository.sumPostedRoiMinorByInvestment(investmentId),
      this.deps.settlementRepository.sumRoiLedgerPostedMinorByInvestment(investmentId),
    ]);

    return reconcileInvestment({
      investmentId,
      settlementPostedRoiMinor,
      roiLedgerPostedRoiMinor,
      ledgerPostedRoiMinor: roiLedgerPostedRoiMinor,
      lockedPrincipalMinor: investment.status === "matured" ? 0n : investment.principalMinor,
      expectedLockedPrincipalMinor:
        investment.status === "matured" ? 0n : investment.principalMinor,
    });
  }

  private async settleInvestment(
    settlementRunId: string,
    investment: InvestmentRecord,
    settlementDate: string,
  ): Promise<{ investmentId: string; status: "posted" | "skipped" }> {
    if (!investment.firstSettlementDate || !investment.maturityDate) {
      return { investmentId: investment.id, status: "skipped" };
    }

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.deps.investmentRepository.lockInvestmentById(tx, investment.id);
      const existing =
        await this.deps.settlementRepository.findSettlementItemByInvestmentAndDateInTransaction(
          tx,
          investment.id,
          settlementDate,
        );
      if (existing) {
        return { investmentId: investment.id, status: "skipped" };
      }

      const wallet = await this.deps.ledgerRepository.findWalletByUserCurrency(
        investment.userId,
        investment.currency,
      );
      if (!wallet) {
        throw new AppError({ code: "INVALID_STATE", message: "Customer wallet was not found." });
      }

      const [availableAccount, lockedAccount, platformRoiAccount] = await Promise.all([
        this.requireWalletAccount(wallet.id, "available"),
        this.requireWalletAccount(wallet.id, "locked"),
        this.deps.ledgerRepository.ensureLedgerAccount(tx, {
          ownerType: "platform",
          ownerId: "unique_sky_way",
          accountType: "platform_roi_expense",
          currency: investment.currency,
          status: "active",
        }),
      ]);

      const totalPosted =
        await this.deps.settlementRepository.sumPostedRoiMinorByInvestmentInTransaction(
          tx,
          investment.id,
        );
      const remainingPromisedRoiMinor =
        investment.promisedRoiMinor === null ? null : investment.promisedRoiMinor - totalPosted;
      const isFinalEarningDate = settlementDate === investment.maturityDate;
      const roi = calculateDailyRoi({
        principalMinor: investment.principalMinor,
        dailyRoiBps: investment.dailyRoiBps,
        previousResidualMicroMinor: investment.roundingResidualMicroMinor,
        remainingPromisedRoiMinor,
        forceFinalRemainder: remainingPromisedRoiMinor !== null && isFinalEarningDate,
      });

      if (roi.postedRoiMinor === 0n) {
        await this.deps.settlementRepository.createSettlementItem(tx, {
          settlementRunId,
          investmentId: investment.id,
          earningDate: settlementDate,
          settlementDate,
          grossRoiMicroMinor: roi.grossRoiMicroMinor,
          previousResidualMicroMinor: investment.roundingResidualMicroMinor,
          postedRoiMinor: 0n,
          nextResidualMicroMinor: roi.nextResidualMicroMinor,
          calculationVersion: roi.calculationVersion,
          status: "skipped",
          reason: "zero_roi",
          metadata: { visualOnly: false },
        });

        if (isFinalEarningDate && investment.principalReturnPolicy === "return_at_maturity") {
          await this.releasePrincipalAtMaturity(tx, investment, lockedAccount, availableAccount);
        } else if (isFinalEarningDate) {
          await this.deps.investmentRepository.markInvestmentMaturing(
            tx,
            investment.id,
            roi.nextResidualMicroMinor,
          );
        } else {
          await this.deps.investmentRepository.updateInvestmentResidual(
            tx,
            investment.id,
            roi.nextResidualMicroMinor,
          );
        }

        return { investmentId: investment.id, status: "skipped" };
      }

      const roiEntries = createRoiSettlementEntries({
        platformRoiExpenseAccountId: platformRoiAccount.id,
        customerAvailableAccountId: availableAccount.id,
        amountMinor: roi.postedRoiMinor,
        currency: investment.currency,
      });
      assertBalancedLedgerPosting({ entries: roiEntries });

      const ledgerPosting = await this.deps.ledgerRepository.postLedgerTransaction(tx, {
        transaction: {
          transactionType: "roi_settlement",
          idempotencyKey: `roi_settlement:${investment.id}:${settlementDate}`,
          referenceType: "investment",
          referenceId: investment.id,
          description: "Daily ROI settlement",
          metadata: {
            settlementDate,
            invariantIds: ["FI-501", "FI-604", "FI-605"],
          },
        },
        entries: roiEntries,
      });

      const settlementItem = await this.deps.settlementRepository.createSettlementItem(tx, {
        settlementRunId,
        investmentId: investment.id,
        earningDate: settlementDate,
        settlementDate,
        grossRoiMicroMinor: roi.grossRoiMicroMinor,
        previousResidualMicroMinor: investment.roundingResidualMicroMinor,
        postedRoiMinor: roi.postedRoiMinor,
        nextResidualMicroMinor: roi.nextResidualMicroMinor,
        calculationVersion: roi.calculationVersion,
        ledgerTransactionId: ledgerPosting.transaction.id,
        status: "posted",
        metadata: {
          capped: roi.capped,
          finalResidualPolicy: isFinalEarningDate ? "whole_minor_only" : null,
        },
      });

      await this.deps.settlementRepository.createRoiLedgerEntry(tx, {
        investmentId: investment.id,
        settlementItemId: settlementItem.id,
        earningDate: settlementDate,
        settlementDate,
        principalMinor: investment.principalMinor,
        dailyRoiBps: investment.dailyRoiBps,
        grossRoiMicroMinor: roi.grossRoiMicroMinor,
        previousResidualMicroMinor: investment.roundingResidualMicroMinor,
        postedRoiMinor: roi.postedRoiMinor,
        nextResidualMicroMinor: roi.nextResidualMicroMinor,
        ledgerTransactionId: ledgerPosting.transaction.id,
        calculationVersion: roi.calculationVersion,
        status: "posted",
      });

      await this.deps.investmentRepository.markRoiScheduleItemPosted(
        tx,
        investment.id,
        settlementDate,
        this.deps.clock.now(),
      );

      if (isFinalEarningDate && investment.principalReturnPolicy === "return_at_maturity") {
        await this.releasePrincipalAtMaturity(tx, investment, lockedAccount, availableAccount);
      } else if (isFinalEarningDate) {
        await this.deps.investmentRepository.markInvestmentMaturing(
          tx,
          investment.id,
          roi.nextResidualMicroMinor,
        );
      } else {
        await this.deps.investmentRepository.updateInvestmentResidual(
          tx,
          investment.id,
          roi.nextResidualMicroMinor,
        );
      }

      return { investmentId: investment.id, status: "posted" };
    });
  }

  private async releasePrincipalAtMaturity(
    tx: DrizzleTransactionContext,
    investment: InvestmentRecord,
    lockedAccount: LedgerAccountRecord,
    availableAccount: LedgerAccountRecord,
  ) {
    const maturityEntries = createMaturityPrincipalReleaseEntries({
      lockedAccountId: lockedAccount.id,
      availableAccountId: availableAccount.id,
      amountMinor: investment.principalMinor,
      currency: investment.currency,
    });
    assertBalancedLedgerPosting({ entries: maturityEntries });

    const maturityLedger = await this.deps.ledgerRepository.postLedgerTransaction(tx, {
      transaction: {
        transactionType: "maturity_principal_release",
        idempotencyKey: `maturity_principal_release:${investment.id}`,
        referenceType: "investment",
        referenceId: investment.id,
        description: "Investment maturity principal release",
        metadata: { invariantIds: ["FI-701", "FI-703"] },
      },
      entries: maturityEntries,
    });

    await this.deps.investmentRepository.markInvestmentMatured(tx, investment.id, {
      maturedAt: this.deps.clock.now(),
      maturityLedgerTransactionId: maturityLedger.transaction.id,
      roundingResidualMicroMinor: 0n,
    });
  }

  private async requireWalletAccount(
    walletId: string,
    category: "pending" | "available" | "locked" | "reserved" | "withdrawn",
  ) {
    const account = await this.deps.ledgerRepository.findWalletAccountByCategory({
      walletId,
      category,
    });

    if (!account) {
      throw new AppError({
        code: "INVALID_STATE",
        message: `Customer ${category} ledger account was not found.`,
      });
    }

    return account;
  }
}

function validatePlanVersion(
  planVersion: {
    status: string;
    currency: string;
    minPrincipalMinor: bigint;
    maxPrincipalMinor: bigint;
    effectiveFrom: Date;
    effectiveTo: Date | null;
  },
  principalMinor: bigint,
  now: Date,
) {
  if (planVersion.status !== "active") {
    throw new AppError({
      code: "INVALID_STATE",
      message: "Investment plan version is not active.",
    });
  }

  if (
    principalMinor < planVersion.minPrincipalMinor ||
    principalMinor > planVersion.maxPrincipalMinor
  ) {
    throw new AppError({
      code: "VALIDATION_ERROR",
      message: "Principal is outside the investment plan limits.",
    });
  }

  if (
    planVersion.effectiveFrom > now ||
    (planVersion.effectiveTo && planVersion.effectiveTo < now)
  ) {
    throw new AppError({
      code: "INVALID_STATE",
      message: "Investment plan version is not effective for the activation time.",
    });
  }
}

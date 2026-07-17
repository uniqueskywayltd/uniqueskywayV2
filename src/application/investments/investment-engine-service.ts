import "server-only";

import { AppError } from "@/application/errors";
import type { Clock } from "@/application/ports";
import {
  calculateContinuousLiveAccrual,
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
  IdentityRepository,
  InvestmentRecord,
  InvestmentRepository,
  LedgerAccountRecord,
  LedgerRepository,
  NotificationRepository,
  ReferralRepository,
  SettlementRepository,
} from "@/infrastructure/database";

export interface InvestmentEngineServiceDependencies {
  clock: Clock;
  transactionManager: DrizzleTransactionManager;
  coreRepository: CoreRepository;
  investmentRepository: InvestmentRepository;
  ledgerRepository: LedgerRepository;
  settlementRepository: SettlementRepository;
  /** Optional — when present, customer transaction emails are queued (idempotent). */
  notificationRepository?: NotificationRepository;
  identityRepository?: IdentityRepository;
  referralRepository?: ReferralRepository;
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

export interface StopInvestmentInput {
  investmentId: string;
  /** When false, only plans with early_exit_policy = allowed_with_penalty may stop. */
  force?: boolean;
  actorUserId?: string;
  reason?: string;
  stoppedAt?: Date;
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
          message: "Insufficient available balance.",
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

      if (this.deps.notificationRepository && this.deps.identityRepository) {
        const plan = await this.deps.coreRepository.findInvestmentPlanById(planVersion.planId);
        const preferences = await this.deps.coreRepository.findCustomerPreferencesByUserId(
          input.userId,
        );
        const profile = await this.deps.coreRepository.findCustomerProfileByUserId(input.userId);
        const { getBrand } = await import("@/emails/brand");
        const { buildInvestmentActivatedEmailFields } =
          await import("@/emails/investment-activated-fields");
        const brand = getBrand();
        const emailFields = buildInvestmentActivatedEmailFields({
          planName: plan?.name ?? "Investment plan",
          investmentId: activatedInvestment.id,
          principalMinor: input.principalMinor,
          currency: planVersion.currency,
          dailyRoiBps: planVersion.dailyRoiBps,
          termDays: planVersion.termDays,
          promisedRoiMinor,
          activatedAt,
          firstSettlementDate: firstEligibleDate,
          maturityDate: finalEarningDate,
          appBaseUrl: brand.url,
          timeZone: preferences?.timeZone ?? "America/New_York",
        });

        await this.enqueueInvestmentEmail(tx, input.userId, "investment.activated", {
          investmentId: activatedInvestment.id,
          principalMinor: String(input.principalMinor),
          currency: planVersion.currency,
          trigger: "investment.activated",
          ...(profile?.legalName ? { name: profile.legalName, legalName: profile.legalName } : {}),
          ...(profile?.displayName ? { displayName: profile.displayName } : {}),
          planName: emailFields.planName,
          principal: emailFields.principal,
          dailyRate: emailFields.dailyRate,
          dailyEarnings: emailFields.dailyEarnings,
          duration: emailFields.duration,
          startDateTime: emailFields.startDateTime,
          maturityDateTime: emailFields.maturityDateTime,
          expectedProfit: emailFields.expectedProfit,
          maturityValue: emailFields.maturityValue,
          nextSettlement: emailFields.nextSettlement,
          referenceId: emailFields.reference,
          investmentUrl: emailFields.investmentUrl,
          dashboardUrl: emailFields.dashboardUrl,
          schedule: emailFields.schedule,
          currentYear: emailFields.currentYear,
          amountMinor: String(input.principalMinor),
        });

        const { enqueueAdminEmail } = await import("@/application/notifications/admin-email");
        await enqueueAdminEmail(tx, this.deps.notificationRepository, {
          eventType: "admin.investment_started",
          idempotencyKey: `admin.investment_started:${activatedInvestment.id}`,
          customerId: input.userId,
          metadata: {
            customerName: profile?.legalName?.trim() || profile?.displayName?.trim() || "Customer",
            planName: emailFields.planName,
            amount: emailFields.principal,
            dailyRoi: emailFields.dailyRate,
            duration: emailFields.duration,
            expectedRoi: emailFields.expectedProfit,
            maturityValue: emailFields.maturityValue,
            startDateTime: emailFields.startDateTime,
            referenceId: emailFields.reference,
            adminDashboardUrl: `${brand.url}/admin/investments/${activatedInvestment.id}`,
          },
        });
      }

      await this.enqueueReferralCommissionEmail(tx, {
        referredUserId: input.userId,
        investmentId: investment.id,
        principalMinor: input.principalMinor,
        currency: planVersion.currency,
      });

      return { investment: activatedInvestment, idempotent: false };
    });
  }

  /**
   * Early exit: credit exact-second accrued ROI (minus penalty if configured),
   * unlock principal, skip remaining schedule, mark cancelled.
   * One ledger write for ROI + one for principal release — never continuous writes.
   */
  async stopInvestment(input: StopInvestmentInput) {
    const investment = await this.deps.investmentRepository.findInvestmentById(input.investmentId);
    if (!investment) {
      throw new AppError({ code: "NOT_FOUND", message: "Investment was not found." });
    }

    if (investment.status === "cancelled") {
      return {
        investment,
        idempotent: true as const,
        accruedRoiMinor: 0n,
        penaltyMinor: 0n,
        creditRoiMinor: 0n,
        principalReleasedMinor: 0n,
      };
    }

    if (investment.status === "matured") {
      throw new AppError({
        code: "INVALID_STATE",
        message: "Matured investments cannot be stopped.",
      });
    }

    if (investment.status !== "active" && investment.status !== "maturing") {
      throw new AppError({
        code: "INVALID_STATE",
        message: `Investment cannot be stopped from status ${investment.status}.`,
      });
    }

    if (!investment.activatedAt) {
      throw new AppError({
        code: "INVALID_STATE",
        message: "Investment is not activated.",
      });
    }

    const planVersion = await this.deps.coreRepository.findInvestmentPlanVersionById(
      investment.planVersionId,
    );
    if (!planVersion) {
      throw new AppError({ code: "NOT_FOUND", message: "Investment plan version was not found." });
    }

    const force = input.force === true;
    if (!force && planVersion.earlyExitPolicy !== "allowed_with_penalty") {
      throw new AppError({
        code: "INVALID_STATE",
        message: "Early exit is not allowed for this investment package.",
      });
    }

    const stoppedAt = input.stoppedAt ?? this.deps.clock.now();
    const penaltyBps = readEarlyExitPenaltyBps(planVersion.metadata);

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const fresh = await this.deps.investmentRepository.lockInvestmentById(tx, investment.id);
      if (!fresh) {
        throw new AppError({ code: "NOT_FOUND", message: "Investment was not found." });
      }
      if (fresh.status === "cancelled") {
        return {
          investment: fresh,
          idempotent: true as const,
          accruedRoiMinor: 0n,
          penaltyMinor: 0n,
          creditRoiMinor: 0n,
          principalReleasedMinor: 0n,
        };
      }
      if (fresh.status !== "active" && fresh.status !== "maturing") {
        throw new AppError({
          code: "INVALID_STATE",
          message: `Investment cannot be stopped from status ${fresh.status}.`,
        });
      }
      if (!fresh.activatedAt) {
        throw new AppError({
          code: "INVALID_STATE",
          message: "Investment is not activated.",
        });
      }

      const wallet = await this.deps.ledgerRepository.findWalletByUserCurrency(
        fresh.userId,
        fresh.currency,
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
          currency: fresh.currency,
          status: "active",
        }),
      ]);

      const postedRoiMinor =
        await this.deps.settlementRepository.sumPostedRoiMinorByInvestmentInTransaction(
          tx,
          fresh.id,
        );

      const live = calculateContinuousLiveAccrual({
        principalMinor: fresh.principalMinor,
        dailyRoiBps: fresh.dailyRoiBps,
        activatedAt: fresh.activatedAt,
        termDays: fresh.termDays,
        postedRoiMinor,
        promisedRoiMinor: fresh.promisedRoiMinor,
        now: stoppedAt,
      });

      const grossUnposted = live.unpostedAccruedMinor;
      const penaltyMinor = (grossUnposted * BigInt(penaltyBps)) / 10_000n;
      const creditRoiMinor = grossUnposted > penaltyMinor ? grossUnposted - penaltyMinor : 0n;

      if (creditRoiMinor > 0n) {
        const roiEntries = createRoiSettlementEntries({
          platformRoiExpenseAccountId: platformRoiAccount.id,
          customerAvailableAccountId: availableAccount.id,
          amountMinor: creditRoiMinor,
          currency: fresh.currency,
        });
        assertBalancedLedgerPosting({ entries: roiEntries });

        await this.deps.ledgerRepository.postLedgerTransaction(tx, {
          transaction: {
            transactionType: "roi_settlement",
            idempotencyKey: `roi_settlement:early_exit:${fresh.id}`,
            referenceType: "investment",
            referenceId: fresh.id,
            description: "Early exit ROI settlement",
            metadata: {
              invariantIds: ["FI-501", "FI-604"],
              earlyExit: true,
              grossUnpostedMinor: String(grossUnposted),
              penaltyBps,
              penaltyMinor: String(penaltyMinor),
              creditRoiMinor: String(creditRoiMinor),
              elapsedSeconds: live.elapsedSeconds,
              stoppedBy: input.actorUserId ?? null,
              reason: input.reason ?? null,
            },
          },
          entries: roiEntries,
        });
      }

      const maturityEntries = createMaturityPrincipalReleaseEntries({
        lockedAccountId: lockedAccount.id,
        availableAccountId: availableAccount.id,
        amountMinor: fresh.principalMinor,
        currency: fresh.currency,
      });
      assertBalancedLedgerPosting({ entries: maturityEntries });

      await this.deps.ledgerRepository.postLedgerTransaction(tx, {
        transaction: {
          transactionType: "maturity_principal_release",
          idempotencyKey: `investment_cancel_release:${fresh.id}`,
          referenceType: "investment",
          referenceId: fresh.id,
          description: force
            ? "Force stop investment principal release"
            : "Early exit investment principal release",
          metadata: {
            invariantIds: ["FI-701"],
            earlyExit: true,
            force,
            reason: input.reason ?? null,
            stoppedBy: input.actorUserId ?? null,
          },
        },
        entries: maturityEntries,
      });

      await this.deps.investmentRepository.skipRemainingRoiScheduleItems(tx, fresh.id);

      const cancelled = await this.deps.investmentRepository.markInvestmentCancelled(
        tx,
        fresh.id,
        stoppedAt,
      );

      await this.enqueueInvestmentEmail(tx, fresh.userId, "investment.completed", {
        investmentId: fresh.id,
        settlementDate: "early_exit",
        trigger: "investment.stopped",
        creditRoiMinor: String(creditRoiMinor),
        principalReleasedMinor: String(fresh.principalMinor),
      });

      if (this.deps.notificationRepository) {
        const { enqueueAdminEmail } = await import("@/application/notifications/admin-email");
        const { getBrand } = await import("@/emails/brand");
        const { formatMoneyMinorUnits } = await import("@/i18n/format");
        const profile = await this.deps.coreRepository.findCustomerProfileByUserId(fresh.userId);
        const brand = getBrand();
        await enqueueAdminEmail(tx, this.deps.notificationRepository, {
          eventType: "admin.investment_stopped",
          idempotencyKey: `admin.investment_stopped:${fresh.id}`,
          customerId: fresh.userId,
          metadata: {
            customerName: profile?.legalName?.trim() || profile?.displayName?.trim() || "Customer",
            amount: formatMoneyMinorUnits("en", Number(fresh.principalMinor), fresh.currency),
            referenceId: fresh.id,
            adminDashboardUrl: `${brand.url}/admin/investments/${fresh.id}`,
          },
        });
      }

      return {
        investment: cancelled,
        idempotent: false as const,
        accruedRoiMinor: grossUnposted,
        penaltyMinor,
        creditRoiMinor,
        principalReleasedMinor: fresh.principalMinor,
      };
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
        await this.enqueueInvestmentEmail(tx, investment.userId, "investment.completed", {
          investmentId: investment.id,
          settlementDate,
        });
        await this.enqueueAdminInvestmentMatured(tx, investment);
      } else if (isFinalEarningDate) {
        await this.deps.investmentRepository.markInvestmentMaturing(
          tx,
          investment.id,
          roi.nextResidualMicroMinor,
        );
        await this.enqueueInvestmentEmail(tx, investment.userId, "investment.completed", {
          investmentId: investment.id,
          settlementDate,
        });
        await this.enqueueAdminInvestmentMatured(tx, investment);
      } else {
        await this.deps.investmentRepository.updateInvestmentResidual(
          tx,
          investment.id,
          roi.nextResidualMicroMinor,
        );
      }

      if (roi.postedRoiMinor > 0n) {
        await this.enqueueInvestmentEmail(tx, investment.userId, "investment.roi_credited", {
          investmentId: investment.id,
          settlementDate,
          postedRoiMinor: String(roi.postedRoiMinor),
        });
      }

      return { investmentId: investment.id, status: "posted" };
    });
  }

  private async enqueueAdminInvestmentMatured(
    tx: DrizzleTransactionContext,
    investment: InvestmentRecord,
  ) {
    if (!this.deps.notificationRepository) return;
    const { enqueueAdminEmail } = await import("@/application/notifications/admin-email");
    const { getBrand } = await import("@/emails/brand");
    const { formatMoneyMinorUnits } = await import("@/i18n/format");
    const profile = await this.deps.coreRepository.findCustomerProfileByUserId(investment.userId);
    const brand = getBrand();
    await enqueueAdminEmail(tx, this.deps.notificationRepository, {
      eventType: "admin.investment_matured",
      idempotencyKey: `admin.investment_matured:${investment.id}`,
      customerId: investment.userId,
      metadata: {
        customerName: profile?.legalName?.trim() || profile?.displayName?.trim() || "Customer",
        amount: formatMoneyMinorUnits("en", Number(investment.principalMinor), investment.currency),
        referenceId: investment.id,
        adminDashboardUrl: `${brand.url}/admin/investments/${investment.id}`,
      },
    });
  }

  private async enqueueInvestmentEmail(
    tx: DrizzleTransactionContext,
    userId: string,
    templateKey: "investment.activated" | "investment.roi_credited" | "investment.completed",
    metadata: Record<string, unknown>,
  ) {
    const notifications = this.deps.notificationRepository;
    const identity = this.deps.identityRepository;
    if (!notifications || !identity) return;

    const user = await identity.findUserById(userId);
    if (!user) return;

    const investmentId =
      typeof metadata.investmentId === "string" ? metadata.investmentId : "unknown";
    const settlementDate =
      typeof metadata.settlementDate === "string" ? metadata.settlementDate : "na";

    await notifications.enqueueEmail(tx, {
      recipientUserId: userId,
      toEmail: user.email,
      templateKey,
      templateVersion: "v1",
      idempotencyKey: `${templateKey}:${investmentId}:${settlementDate}`,
      metadata: {
        ...metadata,
        trigger: templateKey,
      },
    });
  }

  private async enqueueReferralCommissionEmail(
    tx: DrizzleTransactionContext,
    input: {
      referredUserId: string;
      investmentId: string;
      principalMinor: bigint;
      currency: string;
    },
  ) {
    const referrals = this.deps.referralRepository;
    const notifications = this.deps.notificationRepository;
    const identity = this.deps.identityRepository;
    if (!referrals || !notifications || !identity) return;

    const referral = await referrals.findReferralByReferredUserId(input.referredUserId);
    if (!referral) return;

    const referrer = await identity.findUserById(referral.referrerUserId);
    if (!referrer) return;

    // 10% of principal — matches published plan marketing default until policy table drives this.
    const commissionMinor = (input.principalMinor * 10n) / 100n;
    if (commissionMinor <= 0n) return;

    const referred = await identity.findUserById(input.referredUserId);

    await notifications.enqueueEmail(tx, {
      recipientUserId: referrer.id,
      toEmail: referrer.email,
      templateKey: "referral.reward",
      templateVersion: "v1",
      idempotencyKey: `referral.reward:${referral.id}:${input.investmentId}`,
      metadata: {
        trigger: "referral.reward",
        referralId: referral.id,
        investmentId: input.investmentId,
        amountMinor: String(commissionMinor),
        currency: input.currency,
        referralName: referred?.email?.split("@")[0] ?? "Investor",
        referenceId: referral.id,
      },
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
    if (principalMinor < planVersion.minPrincipalMinor) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Investment amount is below the minimum for this plan.",
      });
    }
    throw new AppError({
      code: "VALIDATION_ERROR",
      message: "Investment amount exceeds this plan's maximum.",
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

function readEarlyExitPenaltyBps(metadata: Record<string, unknown> | null | undefined): number {
  const raw = metadata?.earlyExitPenaltyBps;
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw <= 10_000) {
    return raw;
  }
  if (typeof raw === "string" && /^\d+$/.test(raw)) {
    const parsed = Number(raw);
    if (parsed >= 0 && parsed <= 10_000) return parsed;
  }
  return 0;
}

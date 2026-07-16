import "server-only";

import { AppError } from "@/application/errors";
import type { IdentityProvider } from "@/application/auth";
import type { Clock } from "@/application/ports";
import { InvestmentEngineService } from "@/application/investments/investment-engine-service";
import { calculateContinuousLiveAccrual } from "@/domains/investments";
import { secondsUntilNextNewYorkMidnight } from "@/domains/settlement";
import type {
  CoreRepository,
  DrizzleTransactionManager,
  IdentityRepository,
  InvestmentRecord,
  InvestmentRepository,
  LedgerRepository,
  NotificationRepository,
  PaymentRepository,
  ReferralRepository,
  RoiScheduleItemRecord,
  SettlementRepository,
} from "@/infrastructure/database";

export type PortfolioBucket = "all" | "pending" | "active" | "completed" | "archived";
export type PortfolioSort = "newest" | "maturity" | "status";

export interface ListCustomerInvestmentsInput {
  bucket?: PortfolioBucket;
  q?: string;
  sort?: PortfolioSort;
  limit?: number;
}

export interface ActivateCustomerInvestmentInput {
  planVersionId: string;
  principalMinor: bigint;
  idempotencyKey: string;
}

export interface CustomerPortfolioServiceDependencies {
  identityProvider: IdentityProvider;
  identityRepository: IdentityRepository;
  investmentRepository: InvestmentRepository;
  settlementRepository: SettlementRepository;
  coreRepository: CoreRepository;
  ledgerRepository: LedgerRepository;
  transactionManager: DrizzleTransactionManager;
  clock: Clock;
  notificationRepository: NotificationRepository;
  referralRepository: ReferralRepository;
  paymentRepository?: PaymentRepository;
}

const BUCKET_STATUSES: Record<Exclude<PortfolioBucket, "all">, InvestmentRecord["status"][]> = {
  pending: ["pending"],
  active: ["active", "maturing"],
  completed: ["matured"],
  archived: ["cancelled", "failed"],
};

export class CustomerPortfolioService {
  constructor(private readonly deps: CustomerPortfolioServiceDependencies) {}

  async listPublishedPlans() {
    await this.requireCurrentAppUser();
    const rows = await this.deps.coreRepository.listActivePublishedPlanVersions();
    return {
      plans: rows.map(({ plan, version }) => ({
        planId: plan.id,
        planVersionId: version.id,
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        currency: version.currency,
        minPrincipalMinor: version.minPrincipalMinor.toString(),
        maxPrincipalMinor: version.maxPrincipalMinor.toString(),
        termDays: version.termDays,
        dailyRoiBps: version.dailyRoiBps,
        totalRoiBps: version.totalRoiBps,
        earlyExitPolicy: version.earlyExitPolicy,
        earlyExitPenaltyBps: readPenaltyBps(version.metadata),
      })),
    };
  }

  async activateInvestment(input: ActivateCustomerInvestmentInput) {
    const appUser = await this.requireCurrentAppUser();
    const engine = this.createEngine();

    const result = await engine.activateInvestment({
      userId: appUser.id,
      planVersionId: input.planVersionId,
      principalMinor: input.principalMinor,
      idempotencyKey: input.idempotencyKey,
    });

    return {
      investment: await this.toPortfolioCard(result.investment),
      idempotent: result.idempotent,
    };
  }

  async stopInvestment(investmentId: string) {
    const appUser = await this.requireCurrentAppUser();
    const investment = await this.deps.investmentRepository.findInvestmentById(investmentId);

    if (!investment || investment.userId !== appUser.id) {
      throw new AppError({ code: "NOT_FOUND", message: "Investment was not found." });
    }

    const engine = this.createEngine();
    const result = await engine.stopInvestment({
      investmentId,
      force: false,
      actorUserId: appUser.id,
      reason: "Customer early exit",
    });

    return {
      investment: await this.toPortfolioCard(result.investment),
      accruedRoiMinor: result.accruedRoiMinor.toString(),
      penaltyMinor: result.penaltyMinor.toString(),
      creditRoiMinor: result.creditRoiMinor.toString(),
      principalReleasedMinor: result.principalReleasedMinor.toString(),
      idempotent: result.idempotent,
    };
  }

  async previewStopInvestment(investmentId: string) {
    const appUser = await this.requireCurrentAppUser();
    const investment = await this.deps.investmentRepository.findInvestmentById(investmentId);

    if (!investment || investment.userId !== appUser.id) {
      throw new AppError({ code: "NOT_FOUND", message: "Investment was not found." });
    }

    if (investment.status !== "active" && investment.status !== "maturing") {
      throw new AppError({
        code: "INVALID_STATE",
        message: "Only active investments can be stopped.",
      });
    }

    if (!investment.activatedAt) {
      throw new AppError({ code: "INVALID_STATE", message: "Investment is not activated." });
    }

    const planVersion = await this.deps.coreRepository.findInvestmentPlanVersionById(
      investment.planVersionId,
    );
    if (!planVersion) {
      throw new AppError({ code: "NOT_FOUND", message: "Investment plan version was not found." });
    }

    const canStop = planVersion.earlyExitPolicy === "allowed_with_penalty";
    const penaltyBps = readPenaltyBps(planVersion.metadata);
    const postedRoiMinor = await this.deps.settlementRepository.sumPostedRoiMinorByInvestment(
      investment.id,
    );
    const live = calculateContinuousLiveAccrual({
      principalMinor: investment.principalMinor,
      dailyRoiBps: investment.dailyRoiBps,
      activatedAt: investment.activatedAt,
      termDays: investment.termDays,
      postedRoiMinor,
      promisedRoiMinor: investment.promisedRoiMinor,
      now: this.deps.clock.now(),
    });
    const penaltyMinor = (live.unpostedAccruedMinor * BigInt(penaltyBps)) / 10_000n;
    const creditRoiMinor =
      live.unpostedAccruedMinor > penaltyMinor ? live.unpostedAccruedMinor - penaltyMinor : 0n;
    const finalAmountMinor = investment.principalMinor + creditRoiMinor;

    return {
      canStop,
      earlyExitPolicy: planVersion.earlyExitPolicy,
      principalMinor: investment.principalMinor.toString(),
      accruedRoiMinor: live.unpostedAccruedMinor.toString(),
      postedRoiMinor: postedRoiMinor.toString(),
      penaltyBps,
      penaltyMinor: penaltyMinor.toString(),
      creditRoiMinor: creditRoiMinor.toString(),
      finalAmountMinor: finalAmountMinor.toString(),
      currency: investment.currency,
    };
  }

  async listInvestments(input: ListCustomerInvestmentsInput = {}) {
    const appUser = await this.requireCurrentAppUser();
    const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);
    const bucket = input.bucket ?? "all";
    const sort = input.sort ?? "newest";

    const result = await this.deps.investmentRepository.listInvestments({
      userId: appUser.id,
      limit: 200,
      ...(input.q ? { q: input.q } : {}),
    });

    let rows = result.rows;
    if (bucket !== "all") {
      const allowed = new Set(BUCKET_STATUSES[bucket]);
      rows = rows.filter((row) => allowed.has(row.status));
    }

    rows = sortInvestments(rows, sort).slice(0, limit);

    const planMetaCache = new Map<
      string,
      { name: string; earlyExitPolicy: string; earlyExitPenaltyBps: number }
    >();
    const postedByInvestment =
      await this.deps.settlementRepository.sumPostedRoiMinorByInvestmentIds(
        result.rows.map((r) => r.id),
      );

    const cards = await Promise.all(
      rows.map((row) => this.toPortfolioCard(row, { planMetaCache, postedByInvestment })),
    );
    const summary = await this.buildEnrichedSummary(appUser.id, result.rows, postedByInvestment);

    return {
      summary,
      investments: cards,
    };
  }

  async getInvestment(investmentId: string) {
    const appUser = await this.requireCurrentAppUser();
    const investment = await this.deps.investmentRepository.findInvestmentById(investmentId);

    if (!investment || investment.userId !== appUser.id) {
      throw new AppError({ code: "NOT_FOUND", message: "Investment was not found." });
    }

    const [card, scheduleItems, stopPreview] = await Promise.all([
      this.toPortfolioCard(investment),
      this.deps.investmentRepository.listRoiScheduleItemsByInvestmentId(investmentId),
      investment.status === "active" || investment.status === "maturing"
        ? this.previewStopInvestment(investmentId).catch(() => null)
        : Promise.resolve(null),
    ]);

    return {
      investment: card,
      schedule: scheduleItems.map(serializeScheduleItem),
      lifecycle: buildLifecycle(investment),
      stopPreview,
    };
  }

  private createEngine() {
    return new InvestmentEngineService({
      clock: this.deps.clock,
      transactionManager: this.deps.transactionManager,
      coreRepository: this.deps.coreRepository,
      investmentRepository: this.deps.investmentRepository,
      ledgerRepository: this.deps.ledgerRepository,
      settlementRepository: this.deps.settlementRepository,
      notificationRepository: this.deps.notificationRepository,
      identityRepository: this.deps.identityRepository,
      referralRepository: this.deps.referralRepository,
    });
  }

  private async toPortfolioCard(
    investment: InvestmentRecord,
    options?: {
      planMetaCache?: Map<
        string,
        { name: string; earlyExitPolicy: string; earlyExitPenaltyBps: number }
      >;
      postedByInvestment?: Map<string, bigint>;
    },
  ) {
    const planMeta = await this.resolvePlanMeta(investment.planVersionId, options?.planMetaCache);
    const postedRoiMinor =
      options?.postedByInvestment?.get(investment.id) ??
      (await this.deps.settlementRepository.sumPostedRoiMinorByInvestment(investment.id));

    const promisedRoiMinor =
      investment.promisedRoiMinor ??
      (investment.totalRoiBps !== null
        ? (investment.principalMinor * BigInt(investment.totalRoiBps)) / 10_000n
        : null);

    const dailyRoiMinor = (investment.principalMinor * BigInt(investment.dailyRoiBps)) / 10_000n;

    const isActiveLike = investment.status === "active" || investment.status === "maturing";
    const now = this.deps.clock.now();
    let liveSnapshot = null as ReturnType<typeof calculateContinuousLiveAccrual> | null;
    if (isActiveLike && investment.activatedAt) {
      liveSnapshot = calculateContinuousLiveAccrual({
        principalMinor: investment.principalMinor,
        dailyRoiBps: investment.dailyRoiBps,
        activatedAt: investment.activatedAt,
        termDays: investment.termDays,
        postedRoiMinor,
        promisedRoiMinor: investment.promisedRoiMinor,
        now,
      });
    }

    return {
      id: investment.id,
      planName: planMeta.name,
      currency: investment.currency,
      principalMinor: investment.principalMinor.toString(),
      postedRoiMinor: postedRoiMinor.toString(),
      promisedRoiMinor: promisedRoiMinor?.toString() ?? null,
      dailyRoiBps: investment.dailyRoiBps,
      dailyRoiMinor: dailyRoiMinor.toString(),
      totalRoiBps: investment.totalRoiBps,
      termDays: investment.termDays,
      status: investment.status,
      startAt: investment.startAt?.toISOString() ?? null,
      firstSettlementDate: investment.firstSettlementDate,
      maturityDate: investment.maturityDate,
      activatedAt: investment.activatedAt?.toISOString() ?? null,
      maturedAt: investment.maturedAt?.toISOString() ?? null,
      cancelledAt: investment.cancelledAt?.toISOString() ?? null,
      createdAt: investment.createdAt.toISOString(),
      progressPercent: computeProgressPercent(investment),
      nextMilestone: resolveNextMilestone(investment),
      earlyExitPolicy: planMeta.earlyExitPolicy,
      earlyExitPenaltyBps: planMeta.earlyExitPenaltyBps,
      canStop: isActiveLike && planMeta.earlyExitPolicy === "allowed_with_penalty",
      nextSettlementCountdownSeconds: isActiveLike ? secondsUntilNextNewYorkMidnight(now) : null,
      expectedTotalReturnMinor: promisedRoiMinor
        ? (investment.principalMinor + promisedRoiMinor).toString()
        : null,
      live: liveSnapshot
        ? {
            visualOnly: true as const,
            todayEarningsMinor: liveSnapshot.todayEarningsMinor.toString(),
            totalLiveEarningsMinor: liveSnapshot.totalLiveEarningsMinor.toString(),
            currentValueMinor: liveSnapshot.currentValueMinor.toString(),
            unpostedAccruedMinor: liveSnapshot.unpostedAccruedMinor.toString(),
            elapsedSeconds: liveSnapshot.elapsedSeconds,
          }
        : null,
    };
  }

  private async resolvePlanMeta(
    planVersionId: string,
    cache?: Map<string, { name: string; earlyExitPolicy: string; earlyExitPenaltyBps: number }>,
  ): Promise<{
    name: string;
    earlyExitPolicy: string;
    earlyExitPenaltyBps: number;
  }> {
    const cached = cache?.get(planVersionId);
    if (cached) return cached;

    const version = await this.deps.coreRepository.findInvestmentPlanVersionById(planVersionId);
    if (!version) {
      const fallback = {
        name: "Investment plan",
        earlyExitPolicy: "not_allowed",
        earlyExitPenaltyBps: 0,
      };
      cache?.set(planVersionId, fallback);
      return fallback;
    }
    const plan = await this.deps.coreRepository.findInvestmentPlanById(version.planId);
    const meta = {
      name: plan?.name ?? "Investment plan",
      earlyExitPolicy: version.earlyExitPolicy,
      earlyExitPenaltyBps: readPenaltyBps(version.metadata),
    };
    cache?.set(planVersionId, meta);
    return meta;
  }

  private async buildEnrichedSummary(
    userId: string,
    rows: InvestmentRecord[],
    postedByInvestment?: Map<string, bigint>,
  ) {
    const base = buildPortfolioSummary(rows);
    const currency = "USD";
    const balance = await this.deps.ledgerRepository.findWalletBalanceByUserCurrency(
      userId,
      currency,
    );

    const activeRows = rows.filter((row) => row.status === "active" || row.status === "maturing");
    const postedMap =
      postedByInvestment ??
      (await this.deps.settlementRepository.sumPostedRoiMinorByInvestmentIds(
        activeRows.map((r) => r.id),
      ));

    let totalPostedRoiMinor = 0n;
    let totalLiveEarningsMinor = 0n;
    let todayEarningsMinor = 0n;
    let currentInvestmentValueMinor = 0n;
    const now = this.deps.clock.now();

    for (const row of activeRows) {
      const posted = postedMap.get(row.id) ?? 0n;
      totalPostedRoiMinor += posted;
      if (row.activatedAt) {
        const live = calculateContinuousLiveAccrual({
          principalMinor: row.principalMinor,
          dailyRoiBps: row.dailyRoiBps,
          activatedAt: row.activatedAt,
          termDays: row.termDays,
          postedRoiMinor: posted,
          promisedRoiMinor: row.promisedRoiMinor,
          now,
        });
        totalLiveEarningsMinor += live.totalLiveEarningsMinor;
        todayEarningsMinor += live.todayEarningsMinor;
        currentInvestmentValueMinor += live.currentValueMinor;
      } else {
        currentInvestmentValueMinor += row.principalMinor + posted;
        totalLiveEarningsMinor += posted;
      }
    }

    const available = balance?.availableBalanceMinor ?? 0n;
    const locked = balance?.lockedBalanceMinor ?? 0n;
    const pending = balance?.pendingBalanceMinor ?? 0n;
    const portfolioValueMinor = available + locked + pending;

    let openWithdrawals = 0;
    let pendingDeposits = 0;
    if (this.deps.paymentRepository) {
      const [deposits, withdrawals] = await Promise.all([
        this.deps.paymentRepository.listDepositIntentsByUserId(userId, 50),
        this.deps.paymentRepository.listWithdrawalsByUserId(userId, 50),
      ]);
      pendingDeposits = deposits.filter(
        (row) => row.status === "created" || row.status === "pending",
      ).length;
      openWithdrawals = withdrawals.filter(
        (row) => !["paid", "rejected", "failed", "cancelled"].includes(row.status),
      ).length;
    }

    return {
      ...base,
      currency,
      availableBalanceMinor: available.toString(),
      lockedBalanceMinor: locked.toString(),
      pendingBalanceMinor: pending.toString(),
      portfolioValueMinor: portfolioValueMinor.toString(),
      totalPrincipalMinor: base.activePrincipalMinor,
      totalRoiMinor: totalPostedRoiMinor.toString(),
      todayEarningsMinor: todayEarningsMinor.toString(),
      totalEarningsMinor: totalLiveEarningsMinor.toString(),
      currentInvestmentValueMinor: currentInvestmentValueMinor.toString(),
      positionsCount: base.totalCount,
      openWithdrawals,
      pendingDeposits,
      nextSettlementCountdownSeconds: secondsUntilNextNewYorkMidnight(now),
    };
  }

  private async requireCurrentAppUser() {
    const currentUser = await this.deps.identityProvider.getCurrentUser();

    if (!currentUser) {
      throw new AppError({ code: "AUTHENTICATION_ERROR", message: "Authentication is required." });
    }

    const appUser = await this.deps.identityRepository.findUserByAuthUserId(currentUser.authUserId);

    if (!appUser) {
      throw new AppError({
        code: "AUTHENTICATION_ERROR",
        message: "Authenticated user is not registered.",
      });
    }

    return appUser;
  }
}

function serializeScheduleItem(item: RoiScheduleItemRecord) {
  return {
    id: item.id,
    sequenceNumber: item.sequenceNumber,
    earningDate: item.earningDate,
    settlementDate: item.settlementDate,
    expectedRoiMicroMinor: item.expectedRoiMicroMinor.toString(),
    status: item.status,
    postedAt: item.postedAt?.toISOString() ?? null,
  };
}

export function buildPortfolioSummary(rows: InvestmentRecord[]) {
  const byStatus = {
    pending: 0,
    active: 0,
    maturing: 0,
    matured: 0,
    cancelled: 0,
    failed: 0,
  };

  let activePrincipalMinor = 0n;

  for (const row of rows) {
    byStatus[row.status] += 1;
    if (row.status === "active" || row.status === "maturing") {
      activePrincipalMinor += row.principalMinor;
    }
  }

  return {
    totalCount: rows.length,
    byStatus,
    activePrincipalMinor: activePrincipalMinor.toString(),
  };
}

export function sortInvestments(rows: InvestmentRecord[], sort: PortfolioSort): InvestmentRecord[] {
  const copy = [...rows];
  if (sort === "maturity") {
    return copy.sort((a, b) => (a.maturityDate ?? "9999").localeCompare(b.maturityDate ?? "9999"));
  }
  if (sort === "status") {
    return copy.sort((a, b) => a.status.localeCompare(b.status));
  }
  return copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function computeProgressPercent(investment: InvestmentRecord): number | null {
  if (!investment.maturityDate || investment.termDays <= 0) return null;
  if (investment.status === "matured") return 100;
  if (investment.status === "pending") return 0;

  const start =
    investment.firstSettlementDate ?? investment.activatedAt?.toISOString().slice(0, 10);
  if (!start) return null;

  const startMs = Date.parse(`${start}T12:00:00.000Z`);
  const endMs = Date.parse(`${investment.maturityDate}T12:00:00.000Z`);
  const nowMs = Date.now();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return null;

  const ratio = (nowMs - startMs) / (endMs - startMs);
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

export function resolveNextMilestone(investment: InvestmentRecord): {
  label: string;
  date: string | null;
} {
  if (investment.status === "pending") {
    return { label: "Awaiting activation", date: null };
  }
  if (investment.status === "matured") {
    return { label: "Matured", date: investment.maturityDate };
  }
  if (investment.status === "cancelled" || investment.status === "failed") {
    return { label: "No further milestones", date: null };
  }
  if (investment.status === "maturing") {
    return { label: "Maturity", date: investment.maturityDate };
  }
  return {
    label: "Next settlement (New York midnight)",
    date: investment.firstSettlementDate,
  };
}

function buildLifecycle(investment: InvestmentRecord) {
  return [
    {
      key: "created",
      label: "Created",
      at: investment.createdAt.toISOString(),
      complete: true,
    },
    {
      key: "activated",
      label: "Activated",
      at: investment.activatedAt?.toISOString() ?? null,
      complete: Boolean(investment.activatedAt),
    },
    {
      key: "settling",
      label: "Settling (New York days)",
      at: investment.firstSettlementDate,
      complete: Boolean(investment.firstSettlementDate),
    },
    {
      key: "matured",
      label: "Matured",
      at: investment.maturedAt?.toISOString() ?? investment.maturityDate,
      complete: investment.status === "matured" || Boolean(investment.maturedAt),
    },
  ];
}

function readPenaltyBps(metadata: Record<string, unknown> | null | undefined): number {
  const raw = metadata?.earlyExitPenaltyBps;
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0) return raw;
  if (typeof raw === "string" && /^\d+$/.test(raw)) return Number(raw);
  return 0;
}

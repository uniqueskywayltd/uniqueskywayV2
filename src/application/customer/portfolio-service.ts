import "server-only";

import { AppError } from "@/application/errors";
import type { IdentityProvider } from "@/application/auth";
import type {
  CoreRepository,
  IdentityRepository,
  InvestmentRecord,
  InvestmentRepository,
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

export interface CustomerPortfolioServiceDependencies {
  identityProvider: IdentityProvider;
  identityRepository: IdentityRepository;
  investmentRepository: InvestmentRepository;
  settlementRepository: SettlementRepository;
  coreRepository: CoreRepository;
}

const BUCKET_STATUSES: Record<Exclude<PortfolioBucket, "all">, InvestmentRecord["status"][]> = {
  pending: ["pending"],
  active: ["active", "maturing"],
  completed: ["matured"],
  archived: ["cancelled", "failed"],
};

export class CustomerPortfolioService {
  constructor(private readonly deps: CustomerPortfolioServiceDependencies) {}

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

    const cards = await Promise.all(rows.map((row) => this.toPortfolioCard(row)));

    return {
      summary: buildPortfolioSummary(result.rows),
      investments: cards,
    };
  }

  async getInvestment(investmentId: string) {
    const appUser = await this.requireCurrentAppUser();
    const investment = await this.deps.investmentRepository.findInvestmentById(investmentId);

    if (!investment || investment.userId !== appUser.id) {
      throw new AppError({ code: "NOT_FOUND", message: "Investment was not found." });
    }

    const [card, scheduleItems] = await Promise.all([
      this.toPortfolioCard(investment),
      this.deps.investmentRepository.listRoiScheduleItemsByInvestmentId(investmentId),
    ]);

    return {
      investment: card,
      schedule: scheduleItems.map(serializeScheduleItem),
      lifecycle: buildLifecycle(investment),
    };
  }

  private async toPortfolioCard(investment: InvestmentRecord) {
    const [planName, postedRoiMinor] = await Promise.all([
      this.resolvePlanName(investment.planVersionId),
      this.deps.settlementRepository.sumPostedRoiMinorByInvestment(investment.id),
    ]);

    return {
      id: investment.id,
      planName,
      currency: investment.currency,
      principalMinor: investment.principalMinor.toString(),
      postedRoiMinor: postedRoiMinor.toString(),
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
    };
  }

  private async resolvePlanName(planVersionId: string): Promise<string> {
    const version = await this.deps.coreRepository.findInvestmentPlanVersionById(planVersionId);
    if (!version) return "Investment plan";
    const plan = await this.deps.coreRepository.findInvestmentPlanById(version.planId);
    return plan?.name ?? "Investment plan";
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

export function sortInvestments(
  rows: InvestmentRecord[],
  sort: PortfolioSort,
): InvestmentRecord[] {
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

  const start = investment.firstSettlementDate ?? investment.activatedAt?.toISOString().slice(0, 10);
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
    label: "Maturity (New York day)",
    date: investment.maturityDate,
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

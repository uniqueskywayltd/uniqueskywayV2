import { and, desc, eq, gte, lt, lte, or, sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { investments, roiScheduleItems } from "../schema";
import type { DrizzleTransactionContext } from "../transactions";
import type { AppDatabaseExecutor } from "../types";
import { BaseDrizzleRepository, decodeKeysetCursor, encodeKeysetCursor, singleRow } from "./base-repository";

export type InvestmentRecord = InferSelectModel<typeof investments>;
export type RoiScheduleItemRecord = InferSelectModel<typeof roiScheduleItems>;

export interface ListInvestmentsQuery {
  status?: InvestmentRecord["status"];
  userId?: string;
  q?: string;
  cursor?: string;
  limit: number;
}

export interface ListInvestmentsResult {
  rows: InvestmentRecord[];
  nextCursor: string | null;
}

export class InvestmentRepository extends BaseDrizzleRepository {
  constructor(db: AppDatabaseExecutor) {
    super("investments", db);
  }

  protected clone(db: AppDatabaseExecutor): InvestmentRepository {
    return new InvestmentRepository(db);
  }

  async findInvestmentById(id: string): Promise<InvestmentRecord | null> {
    const rows = await this.db.select().from(investments).where(eq(investments.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async findInvestmentByIdempotencyKey(idempotencyKey: string): Promise<InvestmentRecord | null> {
    const rows = await this.db
      .select()
      .from(investments)
      .where(eq(investments.idempotencyKey, idempotencyKey))
      .limit(1);
    return rows[0] ?? null;
  }

  async findInvestmentByIdempotencyKeyInTransaction(
    context: DrizzleTransactionContext,
    idempotencyKey: string,
  ): Promise<InvestmentRecord | null> {
    const rows = await context.db
      .select()
      .from(investments)
      .where(eq(investments.idempotencyKey, idempotencyKey))
      .limit(1);
    return rows[0] ?? null;
  }

  async lockInvestmentById(
    context: DrizzleTransactionContext,
    investmentId: string,
  ): Promise<void> {
    await context.db.execute(sql`
      select id
      from public.investments
      where id = ${investmentId}
      for update
    `);
  }

  async createInvestment(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof investments>,
  ): Promise<InvestmentRecord> {
    const rows = await context.db.insert(investments).values(values).returning();
    return singleRow(rows, "createInvestment");
  }

  async createRoiScheduleItem(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof roiScheduleItems>,
  ): Promise<RoiScheduleItemRecord> {
    const rows = await context.db.insert(roiScheduleItems).values(values).returning();
    return singleRow(rows, "createRoiScheduleItem");
  }

  async updateInvestmentActivation(
    context: DrizzleTransactionContext,
    investmentId: string,
    values: Pick<
      InferInsertModel<typeof investments>,
      | "status"
      | "startAt"
      | "activatedAt"
      | "firstSettlementDate"
      | "maturityDate"
      | "fundingLedgerTransactionId"
    >,
  ): Promise<InvestmentRecord> {
    const rows = await context.db
      .update(investments)
      .set(values)
      .where(eq(investments.id, investmentId))
      .returning();

    return singleRow(rows, "updateInvestmentActivation");
  }

  async updateInvestmentResidual(
    context: DrizzleTransactionContext,
    investmentId: string,
    roundingResidualMicroMinor: bigint,
  ): Promise<InvestmentRecord> {
    const rows = await context.db
      .update(investments)
      .set({ roundingResidualMicroMinor })
      .where(eq(investments.id, investmentId))
      .returning();

    return singleRow(rows, "updateInvestmentResidual");
  }

  async markInvestmentMatured(
    context: DrizzleTransactionContext,
    investmentId: string,
    values: {
      maturedAt: Date;
      maturityLedgerTransactionId: string;
      roundingResidualMicroMinor: bigint;
    },
  ): Promise<InvestmentRecord> {
    const rows = await context.db
      .update(investments)
      .set({
        status: "matured",
        maturedAt: values.maturedAt,
        maturityLedgerTransactionId: values.maturityLedgerTransactionId,
        roundingResidualMicroMinor: values.roundingResidualMicroMinor,
      })
      .where(eq(investments.id, investmentId))
      .returning();

    return singleRow(rows, "markInvestmentMatured");
  }

  async markInvestmentMaturing(
    context: DrizzleTransactionContext,
    investmentId: string,
    roundingResidualMicroMinor: bigint,
  ): Promise<InvestmentRecord> {
    const rows = await context.db
      .update(investments)
      .set({ status: "maturing", roundingResidualMicroMinor })
      .where(eq(investments.id, investmentId))
      .returning();

    return singleRow(rows, "markInvestmentMaturing");
  }

  async markRoiScheduleItemPosted(
    context: DrizzleTransactionContext,
    investmentId: string,
    earningDate: string,
    postedAt: Date,
  ): Promise<RoiScheduleItemRecord> {
    const rows = await context.db
      .update(roiScheduleItems)
      .set({ status: "posted", postedAt })
      .where(
        and(
          eq(roiScheduleItems.investmentId, investmentId),
          eq(roiScheduleItems.earningDate, earningDate),
        ),
      )
      .returning();

    return singleRow(rows, "markRoiScheduleItemPosted");
  }

  async findRoiScheduleItemByInvestmentAndDate(
    investmentId: string,
    earningDate: string,
  ): Promise<RoiScheduleItemRecord | null> {
    const rows = await this.db
      .select()
      .from(roiScheduleItems)
      .where(
        and(
          eq(roiScheduleItems.investmentId, investmentId),
          eq(roiScheduleItems.earningDate, earningDate),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async listActiveInvestmentsEligibleForSettlement(
    settlementDate: string,
  ): Promise<InvestmentRecord[]> {
    return this.db
      .select()
      .from(investments)
      .where(
        and(
          eq(investments.status, "active"),
          lte(investments.firstSettlementDate, settlementDate),
          gte(investments.maturityDate, settlementDate),
        ),
      )
      .orderBy(sql`${investments.activatedAt} asc`, sql`${investments.id} asc`);
  }

  async listInvestments(query: ListInvestmentsQuery): Promise<ListInvestmentsResult> {
    const conditions = [];

    if (query.status) conditions.push(eq(investments.status, query.status));
    if (query.userId) conditions.push(eq(investments.userId, query.userId));
    const trimmedQuery = query.q?.trim();
    if (trimmedQuery) {
      conditions.push(sql`${investments.id}::text ilike ${`%${trimmedQuery}%`}`);
    }
    if (query.cursor) {
      const cursor = decodeKeysetCursor(query.cursor);
      conditions.push(
        or(
          lt(investments.createdAt, cursor.createdAt),
          and(eq(investments.createdAt, cursor.createdAt), lt(investments.id, cursor.id)),
        ),
      );
    }

    const rows = await this.db
      .select()
      .from(investments)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(investments.createdAt), desc(investments.id))
      .limit(query.limit + 1);

    const hasMore = rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;
    const lastRow = pageRows[pageRows.length - 1];
    const nextCursor =
      hasMore && lastRow
        ? encodeKeysetCursor({ createdAt: lastRow.createdAt, id: lastRow.id })
        : null;

    return { rows: pageRows, nextCursor };
  }

  async listRoiScheduleItemsByInvestmentId(
    investmentId: string,
    limit = 200,
  ): Promise<RoiScheduleItemRecord[]> {
    return this.db
      .select()
      .from(roiScheduleItems)
      .where(eq(roiScheduleItems.investmentId, investmentId))
      .orderBy(roiScheduleItems.sequenceNumber)
      .limit(limit);
  }
}

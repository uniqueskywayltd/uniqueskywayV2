import { and, desc, eq, gte, ilike, inArray, isNotNull, isNull, lt, lte, or, sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { depositIntents, paymentProviderEvents, withdrawalRequests } from "../schema";
import type { DrizzleTransactionContext } from "../transactions";
import type { AppDatabaseExecutor } from "../types";
import { BaseDrizzleRepository, decodeKeysetCursor, encodeKeysetCursor, singleRow } from "./base-repository";

export type DepositIntentRecord = InferSelectModel<typeof depositIntents>;
export type WithdrawalRequestRecord = InferSelectModel<typeof withdrawalRequests>;
export type PaymentProviderEventRecord = InferSelectModel<typeof paymentProviderEvents>;

export interface SearchDepositIntentsQuery {
  q?: string;
  status?: DepositIntentRecord["status"];
  userId?: string;
  from?: Date;
  to?: Date;
  cursor?: string;
  limit: number;
}

export interface SearchDepositIntentsResult {
  rows: DepositIntentRecord[];
  nextCursor: string | null;
}

export interface SearchWithdrawalsQuery {
  q?: string;
  status?: WithdrawalRequestRecord["status"];
  userId?: string;
  from?: Date;
  to?: Date;
  cursor?: string;
  limit: number;
}

export interface SearchWithdrawalsResult {
  rows: WithdrawalRequestRecord[];
  nextCursor: string | null;
}

export interface ListProviderEventsQuery {
  status?: PaymentProviderEventRecord["status"];
  deadLetteredOnly?: boolean;
  limit: number;
  cursor?: string;
}

export interface ListProviderEventsResult {
  rows: PaymentProviderEventRecord[];
  nextCursor: string | null;
}

export interface CountProviderEventsQuery {
  status?: PaymentProviderEventRecord["status"];
  deadLetteredOnly?: boolean;
}

export class PaymentRepository extends BaseDrizzleRepository {
  constructor(db: AppDatabaseExecutor) {
    super("payments", db);
  }

  protected clone(db: AppDatabaseExecutor): PaymentRepository {
    return new PaymentRepository(db);
  }

  async createDepositIntent(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof depositIntents>,
  ): Promise<DepositIntentRecord> {
    const rows = await context.db
      .insert(depositIntents)
      .values(values)
      .onConflictDoUpdate({
        target: depositIntents.idempotencyKey,
        set: {
          updatedAt: depositIntents.updatedAt,
        },
      })
      .returning();
    return singleRow(rows, "createDepositIntent");
  }

  async findDepositIntentById(id: string): Promise<DepositIntentRecord | null> {
    const rows = await this.db
      .select()
      .from(depositIntents)
      .where(eq(depositIntents.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findDepositIntentByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<DepositIntentRecord | null> {
    const rows = await this.db
      .select()
      .from(depositIntents)
      .where(eq(depositIntents.idempotencyKey, idempotencyKey))
      .limit(1);
    return rows[0] ?? null;
  }

  async findDepositIntentByProviderIntent(
    provider: string,
    providerIntentId: string,
  ): Promise<DepositIntentRecord | null> {
    const rows = await this.db
      .select()
      .from(depositIntents)
      .where(
        and(
          eq(depositIntents.provider, provider),
          eq(depositIntents.providerIntentId, providerIntentId),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async findDepositIntentByProviderIntentInTransaction(
    context: DrizzleTransactionContext,
    provider: string,
    providerIntentId: string,
  ): Promise<DepositIntentRecord | null> {
    const rows = await context.db
      .select()
      .from(depositIntents)
      .where(
        and(
          eq(depositIntents.provider, provider),
          eq(depositIntents.providerIntentId, providerIntentId),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async listDepositIntentsByUserId(userId: string, limit = 50): Promise<DepositIntentRecord[]> {
    return this.db
      .select()
      .from(depositIntents)
      .where(eq(depositIntents.userId, userId))
      .orderBy(desc(depositIntents.createdAt))
      .limit(limit);
  }

  async listDepositIntents(
    status?: DepositIntentRecord["status"],
    limit = 100,
  ): Promise<DepositIntentRecord[]> {
    const query = this.db.select().from(depositIntents).orderBy(desc(depositIntents.createdAt));
    if (status) {
      return query.where(eq(depositIntents.status, status)).limit(limit);
    }
    return query.limit(limit);
  }

  async lockDepositIntentById(
    context: DrizzleTransactionContext,
    id: string,
  ): Promise<DepositIntentRecord | null> {
    await context.db.execute(
      sql`select id from public.deposit_intents where id = ${id} for update`,
    );
    const rows = await context.db
      .select()
      .from(depositIntents)
      .where(eq(depositIntents.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async updateDepositIntentProviderAction(
    context: DrizzleTransactionContext,
    id: string,
    values: Pick<
      InferInsertModel<typeof depositIntents>,
      "status" | "providerAuthorizationUrl" | "providerAccessCode" | "providerMetadata"
    >,
  ): Promise<DepositIntentRecord> {
    const rows = await context.db
      .update(depositIntents)
      .set({
        ...values,
        failureReason: null,
        updatedAt: new Date(),
      })
      .where(eq(depositIntents.id, id))
      .returning();
    return singleRow(rows, "updateDepositIntentProviderAction");
  }

  async markDepositIntentConfirmed(
    context: DrizzleTransactionContext,
    id: string,
    values: Pick<
      InferInsertModel<typeof depositIntents>,
      "confirmationLedgerTransactionId" | "providerMetadata"
    >,
  ): Promise<DepositIntentRecord> {
    const rows = await context.db
      .update(depositIntents)
      .set({
        ...values,
        status: "confirmed",
        confirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(depositIntents.id, id))
      .returning();
    return singleRow(rows, "markDepositIntentConfirmed");
  }

  async markDepositIntentFailed(
    context: DrizzleTransactionContext,
    id: string,
    failureReason: string,
  ): Promise<DepositIntentRecord> {
    const rows = await context.db
      .update(depositIntents)
      .set({
        status: "failed",
        failureReason,
        updatedAt: new Date(),
      })
      .where(eq(depositIntents.id, id))
      .returning();
    return singleRow(rows, "markDepositIntentFailed");
  }

  async markDepositIntentCancelled(
    context: DrizzleTransactionContext,
    id: string,
    failureReason: string,
  ): Promise<DepositIntentRecord> {
    const rows = await context.db
      .update(depositIntents)
      .set({
        status: "cancelled",
        failureReason,
        updatedAt: new Date(),
      })
      .where(eq(depositIntents.id, id))
      .returning();
    return singleRow(rows, "markDepositIntentCancelled");
  }

  async markDepositIntentReversed(
    context: DrizzleTransactionContext,
    id: string,
    values: Pick<InferInsertModel<typeof depositIntents>, "reversalLedgerTransactionId">,
  ): Promise<DepositIntentRecord> {
    const rows = await context.db
      .update(depositIntents)
      .set({
        ...values,
        status: "reversed",
        updatedAt: new Date(),
      })
      .where(eq(depositIntents.id, id))
      .returning();
    return singleRow(rows, "markDepositIntentReversed");
  }

  async createWithdrawalRequest(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof withdrawalRequests>,
  ): Promise<WithdrawalRequestRecord> {
    const rows = await context.db
      .insert(withdrawalRequests)
      .values(values)
      .onConflictDoUpdate({
        target: withdrawalRequests.idempotencyKey,
        set: {
          updatedAt: withdrawalRequests.updatedAt,
        },
      })
      .returning();
    return singleRow(rows, "createWithdrawalRequest");
  }

  async findWithdrawalById(id: string): Promise<WithdrawalRequestRecord | null> {
    const rows = await this.db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findWithdrawalByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<WithdrawalRequestRecord | null> {
    const rows = await this.db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.idempotencyKey, idempotencyKey))
      .limit(1);
    return rows[0] ?? null;
  }

  async listWithdrawalsByUserId(userId: string, limit = 50): Promise<WithdrawalRequestRecord[]> {
    return this.db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.userId, userId))
      .orderBy(desc(withdrawalRequests.createdAt))
      .limit(limit);
  }

  async listWithdrawalsByStatus(
    status: WithdrawalRequestRecord["status"],
    limit = 100,
  ): Promise<WithdrawalRequestRecord[]> {
    return this.db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.status, status))
      .orderBy(desc(withdrawalRequests.createdAt))
      .limit(limit);
  }

  async findWithdrawalByProviderPayoutReference(
    providerPayoutReference: string,
  ): Promise<WithdrawalRequestRecord | null> {
    const rows = await this.db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.providerPayoutReference, providerPayoutReference))
      .limit(1);
    return rows[0] ?? null;
  }

  async findOpenWithdrawalByUserCurrency(
    userId: string,
    currency: string,
  ): Promise<WithdrawalRequestRecord | null> {
    const rows = await this.db
      .select()
      .from(withdrawalRequests)
      .where(
        and(
          eq(withdrawalRequests.userId, userId),
          eq(withdrawalRequests.currency, currency),
          inArray(withdrawalRequests.status, [
            "reserved",
            "under_review",
            "approved",
            "processing",
          ]),
        ),
      )
      .orderBy(desc(withdrawalRequests.createdAt))
      .limit(1);
    return rows[0] ?? null;
  }

  async lockWithdrawalById(
    context: DrizzleTransactionContext,
    id: string,
  ): Promise<WithdrawalRequestRecord | null> {
    await context.db.execute(
      sql`select id from public.withdrawal_requests where id = ${id} for update`,
    );
    const rows = await context.db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async markWithdrawalReserved(
    context: DrizzleTransactionContext,
    id: string,
    values: Pick<
      InferInsertModel<typeof withdrawalRequests>,
      "reservationLedgerTransactionId"
    >,
  ): Promise<WithdrawalRequestRecord> {
    const rows = await context.db
      .update(withdrawalRequests)
      .set({
        ...values,
        status: "reserved",
        updatedAt: new Date(),
      })
      .where(eq(withdrawalRequests.id, id))
      .returning();
    return singleRow(rows, "markWithdrawalReserved");
  }

  async markWithdrawalUnderReview(
    context: DrizzleTransactionContext,
    id: string,
  ): Promise<WithdrawalRequestRecord> {
    const rows = await context.db
      .update(withdrawalRequests)
      .set({
        status: "under_review",
        updatedAt: new Date(),
      })
      .where(eq(withdrawalRequests.id, id))
      .returning();
    return singleRow(rows, "markWithdrawalUnderReview");
  }

  async markWithdrawalApproved(
    context: DrizzleTransactionContext,
    id: string,
    values: Pick<
      InferInsertModel<typeof withdrawalRequests>,
      "reviewedBy" | "reviewReason"
    >,
  ): Promise<WithdrawalRequestRecord> {
    const rows = await context.db
      .update(withdrawalRequests)
      .set({
        ...values,
        status: "approved",
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(withdrawalRequests.id, id))
      .returning();
    return singleRow(rows, "markWithdrawalApproved");
  }

  async markWithdrawalRejected(
    context: DrizzleTransactionContext,
    id: string,
    values: Pick<
      InferInsertModel<typeof withdrawalRequests>,
      "reviewedBy" | "reviewReason" | "releaseLedgerTransactionId"
    >,
  ): Promise<WithdrawalRequestRecord> {
    const rows = await context.db
      .update(withdrawalRequests)
      .set({
        ...values,
        status: "rejected",
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(withdrawalRequests.id, id))
      .returning();
    return singleRow(rows, "markWithdrawalRejected");
  }

  async markWithdrawalProcessing(
    context: DrizzleTransactionContext,
    id: string,
    values: Pick<
      InferInsertModel<typeof withdrawalRequests>,
      "provider" | "providerPayoutReference" | "providerMetadata"
    >,
  ): Promise<WithdrawalRequestRecord> {
    const rows = await context.db
      .update(withdrawalRequests)
      .set({
        ...values,
        status: "processing",
        payoutInitiatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(withdrawalRequests.id, id))
      .returning();
    return singleRow(rows, "markWithdrawalProcessing");
  }

  async markWithdrawalPaid(
    context: DrizzleTransactionContext,
    id: string,
    values: Pick<InferInsertModel<typeof withdrawalRequests>, "paymentLedgerTransactionId">,
  ): Promise<WithdrawalRequestRecord> {
    const rows = await context.db
      .update(withdrawalRequests)
      .set({
        ...values,
        status: "paid",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(withdrawalRequests.id, id))
      .returning();
    return singleRow(rows, "markWithdrawalPaid");
  }

  async markWithdrawalFailed(
    context: DrizzleTransactionContext,
    id: string,
    values: Pick<
      InferInsertModel<typeof withdrawalRequests>,
      "failureReason" | "releaseLedgerTransactionId"
    >,
  ): Promise<WithdrawalRequestRecord> {
    const rows = await context.db
      .update(withdrawalRequests)
      .set({
        ...values,
        status: "failed",
        updatedAt: new Date(),
      })
      .where(eq(withdrawalRequests.id, id))
      .returning();
    return singleRow(rows, "markWithdrawalFailed");
  }

  async markWithdrawalCancelled(
    context: DrizzleTransactionContext,
    id: string,
    values: Pick<InferInsertModel<typeof withdrawalRequests>, "releaseLedgerTransactionId">,
  ): Promise<WithdrawalRequestRecord> {
    const rows = await context.db
      .update(withdrawalRequests)
      .set({
        ...values,
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(withdrawalRequests.id, id))
      .returning();
    return singleRow(rows, "markWithdrawalCancelled");
  }

  async recordProviderEvent(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof paymentProviderEvents>,
  ): Promise<PaymentProviderEventRecord> {
    const rows = await context.db
      .insert(paymentProviderEvents)
      .values(values)
      .onConflictDoUpdate({
        target: [paymentProviderEvents.provider, paymentProviderEvents.providerEventId],
        set: {
          status: paymentProviderEvents.status,
        },
      })
      .returning();
    return singleRow(rows, "recordProviderEvent");
  }

  async findProviderEventByProviderEventId(
    provider: string,
    providerEventId: string,
  ): Promise<PaymentProviderEventRecord | null> {
    const rows = await this.db
      .select()
      .from(paymentProviderEvents)
      .where(
        and(
          eq(paymentProviderEvents.provider, provider),
          eq(paymentProviderEvents.providerEventId, providerEventId),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async findProviderEventByProviderEventIdInTransaction(
    context: DrizzleTransactionContext,
    provider: string,
    providerEventId: string,
  ): Promise<PaymentProviderEventRecord | null> {
    const rows = await context.db
      .select()
      .from(paymentProviderEvents)
      .where(
        and(
          eq(paymentProviderEvents.provider, provider),
          eq(paymentProviderEvents.providerEventId, providerEventId),
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async updateProviderEventStatus(
    context: DrizzleTransactionContext,
    id: string,
    values: {
      status: PaymentProviderEventRecord["status"];
      processedAt?: Date | null;
      errorMessage?: string | null;
      attemptCount?: number;
      nextRetryAt?: Date | null;
      deadLetteredAt?: Date | null;
    },
  ): Promise<PaymentProviderEventRecord> {
    const rows = await context.db
      .update(paymentProviderEvents)
      .set(values)
      .where(eq(paymentProviderEvents.id, id))
      .returning();
    return singleRow(rows, "updateProviderEventStatus");
  }

  async lockProviderEventById(
    context: DrizzleTransactionContext,
    id: string,
  ): Promise<PaymentProviderEventRecord | null> {
    await context.db.execute(
      sql`select id from public.payment_provider_events where id = ${id} for update`,
    );
    const rows = await context.db
      .select()
      .from(paymentProviderEvents)
      .where(eq(paymentProviderEvents.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async claimProviderEventForProcessing(
    context: DrizzleTransactionContext,
    id: string,
  ): Promise<PaymentProviderEventRecord | null> {
    const current = await this.lockProviderEventById(context, id);
    if (!current) return null;

    const rows = await context.db
      .update(paymentProviderEvents)
      .set({
        status: "processing",
        attemptCount: current.attemptCount + 1,
      })
      .where(eq(paymentProviderEvents.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async listRetryableProviderEvents(limit = 50): Promise<PaymentProviderEventRecord[]> {
    const now = new Date();
    return this.db
      .select()
      .from(paymentProviderEvents)
      .where(
        and(
          eq(paymentProviderEvents.status, "failed"),
          isNull(paymentProviderEvents.deadLetteredAt),
          or(
            isNull(paymentProviderEvents.nextRetryAt),
            lte(paymentProviderEvents.nextRetryAt, now),
          ),
        ),
      )
      .orderBy(paymentProviderEvents.nextRetryAt)
      .limit(limit);
  }

  async markProviderEventDeadLettered(
    context: DrizzleTransactionContext,
    id: string,
    errorMessage: string,
  ): Promise<PaymentProviderEventRecord> {
    const rows = await context.db
      .update(paymentProviderEvents)
      .set({
        status: "failed",
        deadLetteredAt: new Date(),
        errorMessage,
      })
      .where(eq(paymentProviderEvents.id, id))
      .returning();
    return singleRow(rows, "markProviderEventDeadLettered");
  }

  async searchDepositIntents(query: SearchDepositIntentsQuery): Promise<SearchDepositIntentsResult> {
    const conditions = [];

    const trimmedQuery = query.q?.trim();
    if (trimmedQuery) {
      conditions.push(
        or(
          ilike(depositIntents.providerIntentId, `%${trimmedQuery}%`),
          sql`${depositIntents.id}::text ilike ${`%${trimmedQuery}%`}`,
        ),
      );
    }
    if (query.status) conditions.push(eq(depositIntents.status, query.status));
    if (query.userId) conditions.push(eq(depositIntents.userId, query.userId));
    if (query.from) conditions.push(gte(depositIntents.createdAt, query.from));
    if (query.to) conditions.push(lte(depositIntents.createdAt, query.to));
    if (query.cursor) {
      const cursor = decodeKeysetCursor(query.cursor);
      conditions.push(
        or(
          lt(depositIntents.createdAt, cursor.createdAt),
          and(eq(depositIntents.createdAt, cursor.createdAt), lt(depositIntents.id, cursor.id)),
        ),
      );
    }

    const rows = await this.db
      .select()
      .from(depositIntents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(depositIntents.createdAt), desc(depositIntents.id))
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

  async searchWithdrawals(query: SearchWithdrawalsQuery): Promise<SearchWithdrawalsResult> {
    const conditions = [];

    const trimmedQuery = query.q?.trim();
    if (trimmedQuery) {
      conditions.push(
        or(
          ilike(withdrawalRequests.destinationReference, `%${trimmedQuery}%`),
          ilike(withdrawalRequests.providerPayoutReference, `%${trimmedQuery}%`),
          sql`${withdrawalRequests.id}::text ilike ${`%${trimmedQuery}%`}`,
        ),
      );
    }
    if (query.status) conditions.push(eq(withdrawalRequests.status, query.status));
    if (query.userId) conditions.push(eq(withdrawalRequests.userId, query.userId));
    if (query.from) conditions.push(gte(withdrawalRequests.createdAt, query.from));
    if (query.to) conditions.push(lte(withdrawalRequests.createdAt, query.to));
    if (query.cursor) {
      const cursor = decodeKeysetCursor(query.cursor);
      conditions.push(
        or(
          lt(withdrawalRequests.createdAt, cursor.createdAt),
          and(eq(withdrawalRequests.createdAt, cursor.createdAt), lt(withdrawalRequests.id, cursor.id)),
        ),
      );
    }

    const rows = await this.db
      .select()
      .from(withdrawalRequests)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(withdrawalRequests.createdAt), desc(withdrawalRequests.id))
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

  async countDepositIntentsByStatus(status: DepositIntentRecord["status"]): Promise<number> {
    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(depositIntents)
      .where(eq(depositIntents.status, status));
    return rows[0]?.count ?? 0;
  }

  async countWithdrawalsByStatus(status: WithdrawalRequestRecord["status"]): Promise<number> {
    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.status, status));
    return rows[0]?.count ?? 0;
  }

  async countDepositsCreatedSince(date: Date): Promise<number> {
    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(depositIntents)
      .where(gte(depositIntents.createdAt, date));
    return rows[0]?.count ?? 0;
  }

  async countWithdrawalsCreatedSince(date: Date): Promise<number> {
    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(withdrawalRequests)
      .where(gte(withdrawalRequests.createdAt, date));
    return rows[0]?.count ?? 0;
  }

  async listProviderEvents(query: ListProviderEventsQuery): Promise<ListProviderEventsResult> {
    const conditions = [];

    if (query.status) conditions.push(eq(paymentProviderEvents.status, query.status));
    if (query.deadLetteredOnly) conditions.push(isNotNull(paymentProviderEvents.deadLetteredAt));
    if (query.cursor) {
      const cursor = decodeKeysetCursor(query.cursor);
      conditions.push(
        or(
          lt(paymentProviderEvents.receivedAt, cursor.createdAt),
          and(
            eq(paymentProviderEvents.receivedAt, cursor.createdAt),
            lt(paymentProviderEvents.id, cursor.id),
          ),
        ),
      );
    }

    const rows = await this.db
      .select()
      .from(paymentProviderEvents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(paymentProviderEvents.receivedAt), desc(paymentProviderEvents.id))
      .limit(query.limit + 1);

    const hasMore = rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;
    const lastRow = pageRows[pageRows.length - 1];
    const nextCursor =
      hasMore && lastRow
        ? encodeKeysetCursor({ createdAt: lastRow.receivedAt, id: lastRow.id })
        : null;

    return { rows: pageRows, nextCursor };
  }

  async countProviderEvents(query: CountProviderEventsQuery = {}): Promise<number> {
    const conditions = [];
    if (query.status) conditions.push(eq(paymentProviderEvents.status, query.status));
    if (query.deadLetteredOnly) conditions.push(isNotNull(paymentProviderEvents.deadLetteredAt));

    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(paymentProviderEvents)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    return rows[0]?.count ?? 0;
  }

  async findProviderEventsRelatedToReference(
    reference: string,
    limit = 20,
  ): Promise<PaymentProviderEventRecord[]> {
    return this.db
      .select()
      .from(paymentProviderEvents)
      .where(sql`${paymentProviderEvents.payload}::text ilike ${`%${reference}%`}`)
      .orderBy(desc(paymentProviderEvents.receivedAt))
      .limit(limit);
  }
}

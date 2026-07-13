import { and, desc, eq, inArray, isNull, lte, or, sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { depositIntents, paymentProviderEvents, withdrawalRequests } from "../schema";
import type { DrizzleTransactionContext } from "../transactions";
import type { AppDatabaseExecutor } from "../types";
import { BaseDrizzleRepository, singleRow } from "./base-repository";

export type DepositIntentRecord = InferSelectModel<typeof depositIntents>;
export type WithdrawalRequestRecord = InferSelectModel<typeof withdrawalRequests>;
export type PaymentProviderEventRecord = InferSelectModel<typeof paymentProviderEvents>;

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
}

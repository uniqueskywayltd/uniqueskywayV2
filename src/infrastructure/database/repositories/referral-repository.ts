import { and, desc, eq } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { referralCodes, referralRewards, referrals } from "../schema";
import type { DrizzleTransactionContext } from "../transactions";
import type { AppDatabaseExecutor } from "../types";
import { BaseDrizzleRepository, singleRow } from "./base-repository";

export type ReferralCodeRecord = InferSelectModel<typeof referralCodes>;
export type ReferralRecord = InferSelectModel<typeof referrals>;
export type ReferralRewardRecord = InferSelectModel<typeof referralRewards>;

export class ReferralRepository extends BaseDrizzleRepository {
  constructor(db: AppDatabaseExecutor) {
    super("referrals", db);
  }

  protected clone(db: AppDatabaseExecutor): ReferralRepository {
    return new ReferralRepository(db);
  }

  async createReferralCode(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof referralCodes>,
  ): Promise<ReferralCodeRecord> {
    const rows = await context.db.insert(referralCodes).values(values).returning();
    return singleRow(rows, "createReferralCode");
  }

  async createReferral(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof referrals>,
  ): Promise<ReferralRecord> {
    const rows = await context.db.insert(referrals).values(values).returning();
    return singleRow(rows, "createReferral");
  }

  async createReferralReward(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof referralRewards>,
  ): Promise<ReferralRewardRecord> {
    const rows = await context.db.insert(referralRewards).values(values).returning();
    return singleRow(rows, "createReferralReward");
  }

  async findDefaultReferralCodeByUserId(userId: string): Promise<ReferralCodeRecord | null> {
    const rows = await this.db
      .select()
      .from(referralCodes)
      .where(and(eq(referralCodes.userId, userId), eq(referralCodes.isDefault, true)))
      .limit(1);
    return rows[0] ?? null;
  }

  async listReferralCodesByUserId(userId: string, limit = 10): Promise<ReferralCodeRecord[]> {
    return this.db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.userId, userId))
      .orderBy(desc(referralCodes.createdAt))
      .limit(limit);
  }

  async listReferralsByReferrerUserId(userId: string, limit = 50): Promise<ReferralRecord[]> {
    return this.db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerUserId, userId))
      .orderBy(desc(referrals.createdAt))
      .limit(limit);
  }

  async listRewardsForReferrer(userId: string, limit = 50): Promise<ReferralRewardRecord[]> {
    const rows = await this.db
      .select({ reward: referralRewards })
      .from(referralRewards)
      .innerJoin(referrals, eq(referralRewards.referralId, referrals.id))
      .where(eq(referrals.referrerUserId, userId))
      .orderBy(desc(referralRewards.createdAt))
      .limit(limit);

    return rows.map((row) => row.reward);
  }
}

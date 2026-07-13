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
}

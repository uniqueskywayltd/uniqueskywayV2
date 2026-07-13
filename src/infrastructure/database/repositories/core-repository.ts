import { eq } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import {
  customerAccounts,
  customerPreferences,
  customerProfiles,
  investmentPlans,
  investmentPlanVersions,
} from "../schema";
import type { DrizzleTransactionContext } from "../transactions";
import type { AppDatabaseExecutor } from "../types";
import { BaseDrizzleRepository, singleRow } from "./base-repository";

export type CustomerProfileRecord = InferSelectModel<typeof customerProfiles>;
export type CustomerAccountRecord = InferSelectModel<typeof customerAccounts>;
export type CustomerPreferenceRecord = InferSelectModel<typeof customerPreferences>;
export type InvestmentPlanRecord = InferSelectModel<typeof investmentPlans>;
export type InvestmentPlanVersionRecord = InferSelectModel<typeof investmentPlanVersions>;

export class CoreRepository extends BaseDrizzleRepository {
  constructor(db: AppDatabaseExecutor) {
    super("core", db);
  }

  protected clone(db: AppDatabaseExecutor): CoreRepository {
    return new CoreRepository(db);
  }

  async findCustomerProfileByUserId(userId: string): Promise<CustomerProfileRecord | null> {
    const rows = await this.db
      .select()
      .from(customerProfiles)
      .where(eq(customerProfiles.userId, userId))
      .limit(1);
    return rows[0] ?? null;
  }

  async createCustomerProfile(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof customerProfiles>,
  ): Promise<CustomerProfileRecord> {
    const rows = await context.db.insert(customerProfiles).values(values).returning();
    return singleRow(rows, "createCustomerProfile");
  }

  async ensureCustomerProfile(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof customerProfiles>,
  ): Promise<CustomerProfileRecord> {
    const rows = await context.db
      .insert(customerProfiles)
      .values(values)
      .onConflictDoUpdate({
        target: customerProfiles.userId,
        set: {
          updatedAt: new Date(),
        },
      })
      .returning();

    return singleRow(rows, "ensureCustomerProfile");
  }

  async updateCustomerProfile(
    context: DrizzleTransactionContext,
    userId: string,
    values: Partial<
      Pick<
        InferInsertModel<typeof customerProfiles>,
        "legalName" | "displayName" | "phone" | "country" | "stateRegion" | "dateOfBirth"
      >
    >,
  ): Promise<CustomerProfileRecord> {
    const rows = await context.db
      .update(customerProfiles)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(customerProfiles.userId, userId))
      .returning();

    return singleRow(rows, "updateCustomerProfile");
  }

  async updateCustomerAvatar(
    context: DrizzleTransactionContext,
    userId: string,
    values: Pick<
      InferInsertModel<typeof customerProfiles>,
      "avatarStoragePath" | "avatarContentType" | "avatarUpdatedAt"
    >,
  ): Promise<CustomerProfileRecord> {
    const rows = await context.db
      .update(customerProfiles)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(customerProfiles.userId, userId))
      .returning();

    return singleRow(rows, "updateCustomerAvatar");
  }

  async createCustomerAccount(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof customerAccounts>,
  ): Promise<CustomerAccountRecord> {
    const rows = await context.db.insert(customerAccounts).values(values).returning();
    return singleRow(rows, "createCustomerAccount");
  }

  async findCustomerAccountByUserId(userId: string): Promise<CustomerAccountRecord | null> {
    const rows = await this.db
      .select()
      .from(customerAccounts)
      .where(eq(customerAccounts.userId, userId))
      .limit(1);
    return rows[0] ?? null;
  }

  async ensureCustomerAccount(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof customerAccounts>,
  ): Promise<CustomerAccountRecord> {
    const rows = await context.db
      .insert(customerAccounts)
      .values(values)
      .onConflictDoUpdate({
        target: customerAccounts.userId,
        set: {
          updatedAt: new Date(),
        },
      })
      .returning();

    return singleRow(rows, "ensureCustomerAccount");
  }

  async findCustomerPreferencesByUserId(userId: string): Promise<CustomerPreferenceRecord | null> {
    const rows = await this.db
      .select()
      .from(customerPreferences)
      .where(eq(customerPreferences.userId, userId))
      .limit(1);
    return rows[0] ?? null;
  }

  async ensureCustomerPreferences(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof customerPreferences>,
  ): Promise<CustomerPreferenceRecord> {
    const rows = await context.db
      .insert(customerPreferences)
      .values(values)
      .onConflictDoUpdate({
        target: customerPreferences.userId,
        set: {
          updatedAt: new Date(),
        },
      })
      .returning();

    return singleRow(rows, "ensureCustomerPreferences");
  }

  async updateCustomerPreferences(
    context: DrizzleTransactionContext,
    userId: string,
    values: Partial<
      Pick<
        InferInsertModel<typeof customerPreferences>,
        | "appearance"
        | "language"
        | "timeZone"
        | "inAppNotificationsEnabled"
        | "securityEmailsEnabled"
        | "productEmailsEnabled"
        | "marketingEmailsEnabled"
      >
    >,
  ): Promise<CustomerPreferenceRecord> {
    const rows = await context.db
      .update(customerPreferences)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(customerPreferences.userId, userId))
      .returning();

    return singleRow(rows, "updateCustomerPreferences");
  }

  async createInvestmentPlan(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof investmentPlans>,
  ): Promise<InvestmentPlanRecord> {
    const rows = await context.db.insert(investmentPlans).values(values).returning();
    return singleRow(rows, "createInvestmentPlan");
  }

  async createInvestmentPlanVersion(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof investmentPlanVersions>,
  ): Promise<InvestmentPlanVersionRecord> {
    const rows = await context.db.insert(investmentPlanVersions).values(values).returning();
    return singleRow(rows, "createInvestmentPlanVersion");
  }

  async findInvestmentPlanVersionById(id: string): Promise<InvestmentPlanVersionRecord | null> {
    const rows = await this.db
      .select()
      .from(investmentPlanVersions)
      .where(eq(investmentPlanVersions.id, id))
      .limit(1);

    return rows[0] ?? null;
  }
}

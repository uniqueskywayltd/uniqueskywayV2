import { and, desc, eq, ilike, isNull, lt, ne, or, sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import {
  customerAccounts,
  customerNotes,
  customerPreferences,
  customerProfiles,
  investmentPlans,
  investmentPlanVersions,
  users,
} from "../schema";
import type { DrizzleTransactionContext } from "../transactions";
import type { AppDatabaseExecutor } from "../types";
import { BaseDrizzleRepository, singleRow } from "./base-repository";

export type CustomerProfileRecord = InferSelectModel<typeof customerProfiles>;
export type CustomerAccountRecord = InferSelectModel<typeof customerAccounts>;
export type CustomerPreferenceRecord = InferSelectModel<typeof customerPreferences>;
export type CustomerNoteRecord = InferSelectModel<typeof customerNotes>;
export type InvestmentPlanRecord = InferSelectModel<typeof investmentPlans>;
export type InvestmentPlanVersionRecord = InferSelectModel<typeof investmentPlanVersions>;

export interface SearchCustomersQuery {
  q?: string;
  status?: CustomerAccountRecord["status"];
  kycStatus?: CustomerProfileRecord["kycStatus"];
  limit: number;
  cursor?: string;
}

export interface CustomerSearchRow {
  userId: string;
  email: string;
  userStatus: CustomerAccountRecord["status"];
  emailVerifiedAt: Date | null;
  userCreatedAt: Date;
  displayName: string | null;
  legalName: string | null;
  kycStatus: CustomerProfileRecord["kycStatus"] | null;
  riskStatus: CustomerProfileRecord["riskStatus"] | null;
  accountNumber: string | null;
  accountStatus: CustomerAccountRecord["status"] | null;
  accountRestrictionReason: string | null;
}

export interface SearchCustomersResult {
  rows: CustomerSearchRow[];
  nextCursor: string | null;
}

interface CustomerSearchCursor {
  createdAt: Date;
  userId: string;
}

function encodeCustomerSearchCursor(cursor: CustomerSearchCursor): string {
  return Buffer.from(
    JSON.stringify({ createdAt: cursor.createdAt.toISOString(), userId: cursor.userId }),
  ).toString("base64url");
}

function decodeCustomerSearchCursor(cursor: string): CustomerSearchCursor {
  const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as {
    createdAt: string;
    userId: string;
  };
  return { createdAt: new Date(decoded.createdAt), userId: decoded.userId };
}

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

  async findCustomerProfileByDisplayName(
    displayName: string,
  ): Promise<CustomerProfileRecord | null> {
    const normalized = displayName.trim().toLowerCase();
    if (!normalized) return null;

    const rows = await this.db
      .select()
      .from(customerProfiles)
      .where(sql`lower(${customerProfiles.displayName}) = ${normalized}`)
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

  async findInvestmentPlanById(id: string): Promise<InvestmentPlanRecord | null> {
    const rows = await this.db
      .select()
      .from(investmentPlans)
      .where(eq(investmentPlans.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async listActivePublishedPlanVersions(): Promise<
    Array<{
      plan: InvestmentPlanRecord;
      version: InvestmentPlanVersionRecord;
    }>
  > {
    const rows = await this.db
      .select({
        plan: investmentPlans,
        version: investmentPlanVersions,
      })
      .from(investmentPlanVersions)
      .innerJoin(investmentPlans, eq(investmentPlanVersions.planId, investmentPlans.id))
      .where(and(eq(investmentPlans.status, "active"), eq(investmentPlanVersions.status, "active")))
      .orderBy(investmentPlans.name);

    return rows;
  }

  async listAllPlanVersions(): Promise<
    Array<{
      plan: InvestmentPlanRecord;
      version: InvestmentPlanVersionRecord;
    }>
  > {
    return this.db
      .select({
        plan: investmentPlans,
        version: investmentPlanVersions,
      })
      .from(investmentPlanVersions)
      .innerJoin(investmentPlans, eq(investmentPlanVersions.planId, investmentPlans.id))
      .orderBy(investmentPlans.name, investmentPlanVersions.version);
  }

  async updateInvestmentPlanStatus(
    context: DrizzleTransactionContext,
    planId: string,
    status: "draft" | "active" | "retired",
  ): Promise<InvestmentPlanRecord> {
    const rows = await context.db
      .update(investmentPlans)
      .set({ status, updatedAt: new Date() })
      .where(eq(investmentPlans.id, planId))
      .returning();
    return singleRow(rows, "updateInvestmentPlanStatus");
  }

  async updateInvestmentPlanVersionStatus(
    context: DrizzleTransactionContext,
    planVersionId: string,
    status: "draft" | "active" | "retired",
  ): Promise<InvestmentPlanVersionRecord> {
    const rows = await context.db
      .update(investmentPlanVersions)
      .set({ status })
      .where(eq(investmentPlanVersions.id, planVersionId))
      .returning();
    return singleRow(rows, "updateInvestmentPlanVersionStatus");
  }

  async updateInvestmentPlanVersionTerms(
    context: DrizzleTransactionContext,
    planVersionId: string,
    values: Partial<
      Pick<
        InferInsertModel<typeof investmentPlanVersions>,
        | "minPrincipalMinor"
        | "maxPrincipalMinor"
        | "termDays"
        | "dailyRoiBps"
        | "totalRoiBps"
        | "earlyExitPolicy"
        | "metadata"
        | "status"
        | "effectiveTo"
      >
    >,
  ): Promise<InvestmentPlanVersionRecord> {
    const rows = await context.db
      .update(investmentPlanVersions)
      .set(values)
      .where(eq(investmentPlanVersions.id, planVersionId))
      .returning();
    return singleRow(rows, "updateInvestmentPlanVersionTerms");
  }

  async searchCustomers(query: SearchCustomersQuery): Promise<SearchCustomersResult> {
    const conditions = [];

    const trimmedQuery = query.q?.trim();
    if (trimmedQuery) {
      const pattern = `%${trimmedQuery}%`;
      conditions.push(
        or(
          ilike(users.email, pattern),
          ilike(customerProfiles.displayName, pattern),
          ilike(customerProfiles.legalName, pattern),
          ilike(customerAccounts.accountNumber, pattern),
        ),
      );
    }
    if (query.status) {
      conditions.push(eq(customerAccounts.status, query.status));
    } else {
      // Keep admin queues decluttered; closed accounts are only shown when filtered.
      conditions.push(
        and(
          ne(users.status, "closed"),
          or(ne(customerAccounts.status, "closed"), isNull(customerAccounts.status)),
        ),
      );
    }
    if (query.kycStatus) {
      conditions.push(eq(customerProfiles.kycStatus, query.kycStatus));
    }
    if (query.cursor) {
      const cursor = decodeCustomerSearchCursor(query.cursor);
      conditions.push(
        or(
          lt(users.createdAt, cursor.createdAt),
          and(eq(users.createdAt, cursor.createdAt), lt(users.id, cursor.userId)),
        ),
      );
    }

    const rows = await this.db
      .select({
        userId: users.id,
        email: users.email,
        userStatus: users.status,
        emailVerifiedAt: users.emailVerifiedAt,
        userCreatedAt: users.createdAt,
        displayName: customerProfiles.displayName,
        legalName: customerProfiles.legalName,
        kycStatus: customerProfiles.kycStatus,
        riskStatus: customerProfiles.riskStatus,
        accountNumber: customerAccounts.accountNumber,
        accountStatus: customerAccounts.status,
        accountRestrictionReason: customerAccounts.restrictionReason,
      })
      .from(users)
      .leftJoin(customerProfiles, eq(customerProfiles.userId, users.id))
      .leftJoin(customerAccounts, eq(customerAccounts.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(users.createdAt), desc(users.id))
      .limit(query.limit + 1);

    const hasMore = rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;
    const lastRow = pageRows[pageRows.length - 1];
    const nextCursor =
      hasMore && lastRow
        ? encodeCustomerSearchCursor({ createdAt: lastRow.userCreatedAt, userId: lastRow.userId })
        : null;

    return { rows: pageRows, nextCursor };
  }

  async updateCustomerAccountStatus(
    context: DrizzleTransactionContext,
    userId: string,
    values: {
      status: CustomerAccountRecord["status"];
      restrictionReason: string | null;
      closedAt: Date | null;
    },
  ): Promise<CustomerAccountRecord> {
    const rows = await context.db
      .update(customerAccounts)
      .set({
        status: values.status,
        restrictionReason: values.restrictionReason,
        closedAt: values.closedAt,
        updatedAt: new Date(),
      })
      .where(eq(customerAccounts.userId, userId))
      .returning();

    return singleRow(rows, "updateCustomerAccountStatus");
  }

  async updateCustomerKycStatus(
    context: DrizzleTransactionContext,
    userId: string,
    values: {
      kycStatus: CustomerProfileRecord["kycStatus"];
      riskStatus?: CustomerProfileRecord["riskStatus"];
    },
  ): Promise<CustomerProfileRecord> {
    const rows = await context.db
      .update(customerProfiles)
      .set({
        kycStatus: values.kycStatus,
        ...(values.riskStatus ? { riskStatus: values.riskStatus } : {}),
        updatedAt: new Date(),
      })
      .where(eq(customerProfiles.userId, userId))
      .returning();

    return singleRow(rows, "updateCustomerKycStatus");
  }

  async createCustomerNote(
    context: DrizzleTransactionContext,
    values: InferInsertModel<typeof customerNotes>,
  ): Promise<CustomerNoteRecord> {
    const rows = await context.db.insert(customerNotes).values(values).returning();
    return singleRow(rows, "createCustomerNote");
  }

  async listCustomerNotesByUserId(userId: string, limit = 50): Promise<CustomerNoteRecord[]> {
    return this.db
      .select()
      .from(customerNotes)
      .where(eq(customerNotes.userId, userId))
      .orderBy(desc(customerNotes.createdAt))
      .limit(limit);
  }
}

import { describe, expect, it, vi } from "vitest";

import type { AuthenticatedUser } from "@/application/auth";

import { AdminReportingService } from "./admin-reporting-service";
import { permissionKeysForRoles } from "./test-role-permissions";

const auditContext = {
  requestId: "request_report_1",
  ipAddressHash: "iphash",
  userAgentHash: "uahash",
};

describe("AdminReportingService", () => {
  it("rejects unauthenticated executive dashboard access", async () => {
    const fixture = createFixture({ authenticated: false });
    await expect(fixture.service.getExecutiveDashboard()).rejects.toMatchObject({
      code: "AUTHENTICATION_ERROR",
    });
  });

  it("rejects support agents without reports.read", async () => {
    const fixture = createFixture({ roleKeys: ["support_agent"] });
    await expect(fixture.service.getExecutiveDashboard()).rejects.toMatchObject({
      code: "AUTHORIZATION_ERROR",
    });
  });

  it("aggregates executive dashboard metrics as read-only projections", async () => {
    const fixture = createFixture({ roleKeys: ["auditor"] });
    const dashboard = await fixture.service.getExecutiveDashboard();

    expect(dashboard.customers.total).toBe(100);
    expect(dashboard.customers.verified).toBe(40);
    expect(dashboard.moneyMovement.totalDepositsMinor).toBe("250000");
    expect(dashboard.moneyMovement.totalRoiPaidMinor).toBe("12000");
    expect(fixture.reportingRepository.countCustomerAccounts).toHaveBeenCalled();
    expect(fixture.reportingRepository.sumDepositAmountByStatuses).toHaveBeenCalledWith([
      "confirmed",
    ]);
  });

  it("returns financial period totals with New York timezone metadata", async () => {
    const fixture = createFixture({ roleKeys: ["finance_manager"] });
    const report = await fixture.service.getFinancialReport("period", {
      granularity: "month",
      from: "2026-01-01",
      to: "2026-03-31",
    });

    expect(report).toMatchObject({
      kind: "period",
      timezone: "America/New_York",
      granularity: "month",
    });
    expect(fixture.reportingRepository.periodTotals).toHaveBeenCalledWith(
      "month",
      expect.objectContaining({
        from: expect.any(Date),
        to: expect.any(Date),
      }),
    );
  });

  it("exports CSV with an audit log for reports.export", async () => {
    const fixture = createFixture({ roleKeys: ["platform_admin"] });
    const result = await fixture.service.exportReport(
      {
        reportKey: "financial.deposits",
        format: "csv",
      },
      auditContext,
    );

    expect(result.contentType).toContain("text/csv");
    expect(result.body).toContain("status");
    expect(result.body).toContain("confirmed");
    expect(fixture.operationsRepository.appendAuditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        action: "report.exported",
        targetId: "financial.deposits",
        metadata: expect.objectContaining({
          permissionUsed: "reports.export",
          format: "csv",
        }),
      }),
    );
  });

  it("exports XLSX and rejects actors lacking reports.export", async () => {
    const denied = createFixture({
      roleKeys: ["read_only"],
    });
    await expect(
      denied.service.exportReport(
        { reportKey: "executive.dashboard", format: "xlsx" },
        auditContext,
      ),
    ).rejects.toMatchObject({ code: "AUTHORIZATION_ERROR" });

    const fixture = createFixture({ roleKeys: ["platform_admin"] });
    const result = await fixture.service.exportReport(
      { reportKey: "operational.jobs", format: "xlsx" },
      auditContext,
    );
    expect(result.contentType).toContain("spreadsheetml");
    expect(Buffer.isBuffer(result.body)).toBe(true);
    expect((result.body as Buffer).byteLength).toBeGreaterThan(0);
  });

  it("never exposes mutation methods on the reporting service", () => {
    const fixture = createFixture({ roleKeys: ["auditor"] });
    const service = fixture.service as unknown as Record<string, unknown>;
    expect(service.approveDeposit).toBeUndefined();
    expect(service.postLedgerTransaction).toBeUndefined();
    expect(service.createInvestment).toBeUndefined();
  });
});

interface FixtureOptions {
  authenticated?: boolean;
  roleKeys?: string[];
}

function createFixture(options: FixtureOptions = {}) {
  const authenticated = options.authenticated ?? true;
  const roleKeys = options.roleKeys ?? ["platform_admin"];
  const permissionKeys = permissionKeysForRoles(roleKeys);
  const now = new Date("2026-07-13T16:00:00.000Z");

  const currentUser: AuthenticatedUser = {
    authUserId: "00000000-0000-0000-0000-000000000201",
    email: "reporter@example.com",
    emailVerifiedAt: now,
    displayName: "Reporter",
    mustChangePassword: false,
  };

  const adminAppUser = {
    id: "admin_report_1",
    authUserId: currentUser.authUserId,
    email: currentUser.email,
    emailVerifiedAt: now,
    status: "active" as const,
    createdAt: now,
    updatedAt: now,
  };

  const identityProvider = {
    getCurrentUser: vi.fn(async () => (authenticated ? currentUser : null)),
  };

  const identityRepository = {
    findUserByAuthUserId: vi.fn(async (authUserId: string) =>
      authUserId === adminAppUser.authUserId ? adminAppUser : null,
    ),
    findAdminProfileByUserId: vi.fn(async (userId: string) =>
      userId === adminAppUser.id
        ? {
            id: "admin_profile_report",
            userId,
            status: "active" as const,
            mustChangePassword: false,
            lastActiveAt: now,
            disabledAt: null,
            disabledReason: null,
            createdAt: now,
            updatedAt: now,
          }
        : null,
    ),
    listActiveRoleKeysForUser: vi.fn(async () => roleKeys),
    listActivePermissionKeysForUser: vi.fn(async () => permissionKeys),
  };

  const reportingRepository = {
    probeDatabase: vi.fn(async () => "ok" as const),
    countCustomerAccounts: vi.fn(async (status?: string) => {
      if (status === "suspended") return 5;
      if (status === "active") return 90;
      return 100;
    }),
    countCustomerProfilesByKyc: vi.fn(async () => 40),
    countInvestmentsByStatus: vi.fn(async (status: string) => (status === "active" ? 12 : 3)),
    countDepositsByStatuses: vi.fn(async () => 7),
    countWithdrawalsByStatuses: vi.fn(async () => 4),
    sumDepositAmountByStatuses: vi.fn(async () => 250_000n),
    sumWithdrawalAmountByStatuses: vi.fn(async () => 80_000n),
    sumPostedRoiMinor: vi.fn(async () => 12_000n),
    amountSummaryByStatus: vi.fn(async () => [
      { status: "confirmed", count: 2, amountMinor: "10000" },
    ]),
    countByStatus: vi.fn(async () => [{ status: "completed", count: 1 }]),
    customerGrowth: vi.fn(async () => [{ period: "2026-07-01", count: 3 }]),
    kycStatusDistribution: vi.fn(async () => [{ status: "approved", count: 40 }]),
    geographyDistribution: vi.fn(async () => [{ country: "US", count: 10 }]),
    referralStatusCounts: vi.fn(async () => ({
      referrals: [{ status: "pending", count: 1 }],
      rewards: [],
    })),
    loginActivity: vi.fn(async () => ({
      sessionCounts: [],
      securityCounts: [],
      recentSessions: [],
    })),
    listCustomerExportRows: vi.fn(async () => []),
    periodTotals: vi.fn(async () => [
      {
        period: "2026-01-01",
        depositsAmountMinor: "1",
        withdrawalsAmountMinor: "0",
        roiPaidMinor: "0",
        depositsCount: 1,
        withdrawalsCount: 0,
      },
    ]),
    ledgerSummary: vi.fn(async () => ({
      transactionCount: 9,
      entriesByDirection: [{ direction: "credit", count: 9, amountMinor: "9" }],
    })),
    jobStatusCounts: vi.fn(async () => [{ status: "failed", count: 2 }]),
    emailStatusCounts: vi.fn(async () => [{ status: "queued", count: 1 }]),
    notificationStats: vi.fn(async () => ({
      unread: 1,
      read: 2,
      byType: [],
      deliveries: [],
    })),
    webhookStats: vi.fn(async () => ({
      byStatus: [{ status: "failed", count: 1 }],
      deadLettered: 3,
    })),
    securityEventCounts: vi.fn(async () => [{ severity: "warning", count: 1 }]),
    auditActionCounts: vi.fn(async () => [{ action: "report.exported", count: 1 }]),
  };

  const operationsRepository = {
    countBackgroundJobsByStatus: vi.fn(async () => 2),
    appendAuditLog: vi.fn(async (_tx: unknown, values: Record<string, unknown>) => ({
      id: "audit_report",
      ...values,
      createdAt: now,
    })),
  };

  const transactionManager = {
    runInTransaction: vi.fn(async (fn: (tx: { db: unknown }) => Promise<unknown>) =>
      fn({ db: {} }),
    ),
  };

  const service = new AdminReportingService({
    identityProvider: identityProvider as never,
    identityRepository: identityRepository as never,
    clock: { now: () => now },
    transactionManager: transactionManager as never,
    reportingRepository: reportingRepository as never,
    operationsRepository: operationsRepository as never,
  });

  return { service, reportingRepository, operationsRepository };
}

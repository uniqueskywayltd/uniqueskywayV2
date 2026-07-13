import { describe, expect, it, vi } from "vitest";

import type {
  CoreRepository,
  DrizzleTransactionContext,
  LedgerRepository,
} from "@/infrastructure/database";

import { CustomerIdentityBootstrapService } from "./profile-bootstrap";

describe("CustomerIdentityBootstrapService", () => {
  it("creates profile, account, wallet, and ownership links without ledger postings", async () => {
    const context = { db: {}, transactionId: "tx_identity_bootstrap" } as DrizzleTransactionContext;
    const core = {
      ensureCustomerProfile: vi.fn(async () => ({ id: "profile_1" })),
      ensureCustomerAccount: vi.fn(async () => ({ id: "account_1" })),
    };
    const ledger = {
      ensureWallet: vi.fn(async () => ({ id: "wallet_1", currency: "USD" })),
      ensureLedgerAccount: vi.fn(
        async (_tx: DrizzleTransactionContext, values: { accountType: string }) => ({
          id: `ledger_${values.accountType}`,
        }),
      ),
      ensureWalletAccountLink: vi.fn(async () => undefined),
      postLedgerTransaction: vi.fn(),
    };

    const service = new CustomerIdentityBootstrapService(
      core as unknown as CoreRepository,
      ledger as unknown as LedgerRepository,
    );

    await service.bootstrap(context, {
      userId: "user_1",
      displayName: "Avery Investor",
    });

    expect(core.ensureCustomerProfile).toHaveBeenCalledWith(
      context,
      expect.objectContaining({
        userId: "user_1",
        displayName: "Avery Investor",
        onboardingStatus: "not_started",
        kycStatus: "not_started",
      }),
    );
    expect(core.ensureCustomerAccount).toHaveBeenCalledWith(
      context,
      expect.objectContaining({ userId: "user_1", status: "active" }),
    );
    expect(ledger.ensureWallet).toHaveBeenCalledWith(
      context,
      expect.objectContaining({ userId: "user_1", currency: "USD", status: "active" }),
    );
    expect(ledger.ensureLedgerAccount).toHaveBeenCalledTimes(5);
    expect(ledger.ensureWalletAccountLink).toHaveBeenCalledTimes(5);
    expect(ledger.postLedgerTransaction).not.toHaveBeenCalled();
  });
});

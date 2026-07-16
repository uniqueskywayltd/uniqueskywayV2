import "server-only";

import { randomBytes } from "node:crypto";

import type {
  CoreRepository,
  DrizzleTransactionContext,
  LedgerRepository,
} from "@/infrastructure/database";

const WALLET_ACCOUNT_CATEGORIES = [
  { category: "pending", accountType: "customer_pending_cash" },
  { category: "available", accountType: "customer_available_cash" },
  { category: "locked", accountType: "customer_locked_principal" },
  { category: "reserved", accountType: "customer_reserved_withdrawal" },
  { category: "withdrawn", accountType: "customer_withdrawn_cash" },
] as const;

export interface BootstrapCustomerIdentityInput {
  userId: string;
  displayName?: string | null;
  legalName?: string | null;
  currency?: string;
}

export class CustomerIdentityBootstrapService {
  constructor(
    private readonly core: CoreRepository,
    private readonly ledger: LedgerRepository,
  ) {}

  async bootstrap(context: DrizzleTransactionContext, input: BootstrapCustomerIdentityInput) {
    const currency = input.currency ?? "USD";

    await this.core.ensureCustomerProfile(context, {
      userId: input.userId,
      displayName: input.displayName ?? null,
      legalName: input.legalName ?? null,
      onboardingStatus: "not_started",
      kycStatus: "not_started",
      riskStatus: "not_reviewed",
    });

    await this.core.ensureCustomerAccount(context, {
      userId: input.userId,
      accountNumber: createCustomerAccountNumber(),
      status: "active",
    });

    const wallet = await this.ledger.ensureWallet(context, {
      userId: input.userId,
      currency,
      status: "active",
    });

    for (const walletAccount of WALLET_ACCOUNT_CATEGORIES) {
      const ledgerAccount = await this.ledger.ensureLedgerAccount(context, {
        ownerType: "user",
        ownerId: input.userId,
        accountType: walletAccount.accountType,
        currency,
        status: "active",
      });

      await this.ledger.ensureWalletAccountLink(context, {
        walletId: wallet.id,
        ledgerAccountId: ledgerAccount.id,
        category: walletAccount.category,
      });
    }

    return { wallet };
  }
}

export function createCustomerAccountNumber(): string {
  return `USW-${randomBytes(6).toString("hex").toUpperCase()}`;
}

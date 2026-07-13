export interface LedgerPostingLine {
  accountId: string;
  direction: "debit" | "credit";
  amountMinor: bigint;
  currency: string;
}

export interface BalancedLedgerPosting {
  entries: LedgerPostingLine[];
}

export class LedgerPostingInvariantError extends Error {
  constructor(
    message: string,
    readonly details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = "LedgerPostingInvariantError";
  }
}

export function assertBalancedLedgerPosting(posting: BalancedLedgerPosting): void {
  if (posting.entries.length < 2) {
    throw new LedgerPostingInvariantError("Ledger transaction must contain at least two entries.");
  }

  const balancesByCurrency = new Map<string, bigint>();

  for (const entry of posting.entries) {
    if (entry.amountMinor <= 0n) {
      throw new LedgerPostingInvariantError("Ledger entry amounts must be positive minor units.");
    }

    const current = balancesByCurrency.get(entry.currency) ?? 0n;
    const signedAmount = entry.direction === "credit" ? entry.amountMinor : -entry.amountMinor;
    balancesByCurrency.set(entry.currency, current + signedAmount);
  }

  for (const [currency, balance] of balancesByCurrency) {
    if (balance !== 0n) {
      throw new LedgerPostingInvariantError(
        "Ledger transaction must balance to zero for each currency.",
        {
          currency,
          imbalanceMinor: balance.toString(),
        },
      );
    }
  }
}

export function createInvestmentFundingEntries(input: {
  availableAccountId: string;
  lockedAccountId: string;
  amountMinor: bigint;
  currency: string;
}): LedgerPostingLine[] {
  return [
    {
      accountId: input.availableAccountId,
      direction: "debit",
      amountMinor: input.amountMinor,
      currency: input.currency,
    },
    {
      accountId: input.lockedAccountId,
      direction: "credit",
      amountMinor: input.amountMinor,
      currency: input.currency,
    },
  ];
}

export function createRoiSettlementEntries(input: {
  platformRoiExpenseAccountId: string;
  customerAvailableAccountId: string;
  amountMinor: bigint;
  currency: string;
}): LedgerPostingLine[] {
  return [
    {
      accountId: input.platformRoiExpenseAccountId,
      direction: "debit",
      amountMinor: input.amountMinor,
      currency: input.currency,
    },
    {
      accountId: input.customerAvailableAccountId,
      direction: "credit",
      amountMinor: input.amountMinor,
      currency: input.currency,
    },
  ];
}

export function createMaturityPrincipalReleaseEntries(input: {
  lockedAccountId: string;
  availableAccountId: string;
  amountMinor: bigint;
  currency: string;
}): LedgerPostingLine[] {
  return [
    {
      accountId: input.lockedAccountId,
      direction: "debit",
      amountMinor: input.amountMinor,
      currency: input.currency,
    },
    {
      accountId: input.availableAccountId,
      direction: "credit",
      amountMinor: input.amountMinor,
      currency: input.currency,
    },
  ];
}

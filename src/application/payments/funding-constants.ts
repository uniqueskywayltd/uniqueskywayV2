export const FUNDING_ASSETS = ["BTC", "ETH", "USDT"] as const;
export type FundingAsset = (typeof FUNDING_ASSETS)[number];

export const MANUAL_DEPOSIT_PROVIDER = "manual" as const;
export const MANUAL_WITHDRAWAL_PROVIDER = "manual" as const;

export const WITHDRAWAL_DESTINATION_TYPES = ["crypto_wallet", "bank_transfer"] as const;
export type WithdrawalDestinationType = (typeof WITHDRAWAL_DESTINATION_TYPES)[number];

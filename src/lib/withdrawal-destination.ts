/** Client-safe parsing of withdrawal destinationReference (never render raw JSON). */

export type CryptoWithdrawalDestination = {
  kind: "crypto";
  asset: string;
  network: string;
  address: string;
  methodLabel: string;
  networkLabel: string;
};

export type BankWithdrawalDestination = {
  kind: "bank";
  bankName: string;
  accountName: string;
  accountNumber: string;
};

export type UnknownWithdrawalDestination = {
  kind: "unknown";
  summary: string;
};

export type ParsedWithdrawalDestination =
  CryptoWithdrawalDestination | BankWithdrawalDestination | UnknownWithdrawalDestination;

const ASSET_LABELS: Record<string, string> = {
  BTC: "Bitcoin (BTC)",
  ETH: "Ethereum (ETH)",
  USDT: "Tether (USDT)",
};

const NETWORK_LABELS: Record<string, string> = {
  BTC: "Bitcoin Network",
  Bitcoin: "Bitcoin Network",
  ERC20: "Ethereum (ERC20)",
  TRC20: "Tron (TRC20)",
  ETH: "Ethereum Network",
};

function looksLikeJson(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function cryptoMethodLabel(asset: string): string {
  const key = asset.trim().toUpperCase();
  return ASSET_LABELS[key] ?? `${asset.trim()} Wallet`;
}

export function networkDisplayLabel(network: string): string {
  const trimmed = network.trim();
  return NETWORK_LABELS[trimmed] ?? NETWORK_LABELS[trimmed.toUpperCase()] ?? trimmed;
}

export function shortenWalletAddress(address: string, head = 6, tail = 6): string {
  const value = address.trim();
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

export function parseWithdrawalDestination(
  destinationType: string | null | undefined,
  destinationReference: string | null | undefined,
): ParsedWithdrawalDestination {
  const type = (destinationType ?? "").trim().toLowerCase();
  const raw = (destinationReference ?? "").trim();

  if (!raw) {
    return { kind: "unknown", summary: "Destination not provided" };
  }

  if (looksLikeJson(raw)) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const record = parsed as Record<string, unknown>;
        const address = readString(record, "address");
        const asset = readString(record, "asset");
        const network = readString(record, "network");
        if (address && (type.includes("crypto") || asset || network)) {
          const assetLabel = asset ?? "Crypto";
          return {
            kind: "crypto",
            asset: assetLabel,
            network: network ?? "—",
            address,
            methodLabel: cryptoMethodLabel(assetLabel),
            networkLabel: networkDisplayLabel(network ?? "Network"),
          };
        }
        const bankName = readString(record, "bankName");
        const accountName = readString(record, "accountName");
        const accountNumber = readString(record, "accountNumber");
        if (bankName || accountName || accountNumber) {
          return {
            kind: "bank",
            bankName: bankName ?? "—",
            accountName: accountName ?? "—",
            accountNumber: accountNumber ?? "—",
          };
        }
      }
    } catch {
      // Fall through to non-JSON handling.
    }
  }

  if (type.includes("bank")) {
    return {
      kind: "bank",
      bankName: "—",
      accountName: "—",
      accountNumber: raw,
    };
  }

  if (type.includes("crypto") || type.includes("wallet")) {
    return {
      kind: "crypto",
      asset: "Crypto",
      network: "—",
      address: raw,
      methodLabel: "Crypto Wallet",
      networkLabel: "—",
    };
  }

  // Never surface brace-heavy developer payloads.
  if (looksLikeJson(raw)) {
    return { kind: "unknown", summary: "Destination on file" };
  }

  return { kind: "unknown", summary: raw };
}

export function withdrawalDestinationSummary(destination: ParsedWithdrawalDestination): string {
  if (destination.kind === "crypto") {
    return `${destination.methodLabel} · ${shortenWalletAddress(destination.address)}`;
  }
  if (destination.kind === "bank") {
    return `${destination.bankName} · ${destination.accountNumber}`;
  }
  return destination.summary;
}

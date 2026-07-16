import { describe, expect, it } from "vitest";

import {
  parseWithdrawalDestination,
  shortenWalletAddress,
  withdrawalDestinationSummary,
} from "./withdrawal-destination";

describe("withdrawal-destination", () => {
  it("parses crypto destination JSON into readable fields", () => {
    const parsed = parseWithdrawalDestination(
      "crypto_wallet",
      JSON.stringify({
        asset: "BTC",
        network: "BTC",
        address: "e43tgbvgrefd32sd456ghy45gtfred",
      }),
    );
    expect(parsed.kind).toBe("crypto");
    if (parsed.kind !== "crypto") return;
    expect(parsed.methodLabel).toBe("Bitcoin (BTC)");
    expect(parsed.networkLabel).toBe("Bitcoin Network");
    expect(shortenWalletAddress(parsed.address)).toBe("e43tgb...45gtfred");
    expect(withdrawalDestinationSummary(parsed)).toContain("Bitcoin (BTC)");
    expect(withdrawalDestinationSummary(parsed)).not.toContain("{");
  });

  it("parses bank destination JSON into readable fields", () => {
    const parsed = parseWithdrawalDestination(
      "bank_transfer",
      JSON.stringify({
        bankName: "First National",
        accountName: "Alex Morgan",
        accountNumber: "12345678",
      }),
    );
    expect(parsed).toEqual({
      kind: "bank",
      bankName: "First National",
      accountName: "Alex Morgan",
      accountNumber: "12345678",
    });
  });

  it("never returns raw JSON for malformed payloads", () => {
    const parsed = parseWithdrawalDestination("crypto_wallet", "{not-json");
    expect(parsed.kind).toBe("crypto");
    if (parsed.kind === "crypto") {
      expect(parsed.address).toBe("{not-json");
    }
  });
});

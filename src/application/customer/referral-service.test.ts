import { describe, expect, it } from "vitest";

import {
  buildReferralShareUrl,
  presentReferralStatus,
  presentRewardStatus,
} from "@/application/customer/referral-service";

describe("customer referral presentation", () => {
  it("builds a responsible register share URL", () => {
    expect(buildReferralShareUrl("https://app.example.com", "SKY-AVERY")).toBe(
      "https://app.example.com/auth/register?referral=SKY-AVERY",
    );
  });

  it("uses privacy-safe status vocabulary", () => {
    expect(presentReferralStatus("pending")).toBe("Registered");
    expect(presentReferralStatus("qualified")).toBe("Qualified");
    expect(presentRewardStatus("posted")).toBe("Reward credited");
  });
});

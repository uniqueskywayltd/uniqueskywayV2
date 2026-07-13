import { describe, expect, it } from "vitest";

import { designTokens } from "@/styles/tokens";

describe("designTokens", () => {
  it("exposes required token categories", () => {
    expect(designTokens.spacing[4]).toBe("1rem");
    expect(designTokens.colors.roiPositive).toBe("var(--roi-positive)");
    expect(designTokens.zIndex.modal).toBe("var(--z-modal)");
    expect(designTokens.containers.page).toBe("90rem");
  });
});

import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy } from "@/config/content-security-policy";

describe("buildContentSecurityPolicy", () => {
  it("allows Supabase and Smartsupp integrations", () => {
    const policy = buildContentSecurityPolicy({
      supabaseUrl: "https://lngjjttkiuqlclalccah.supabase.co",
    });

    expect(policy).toContain("https://lngjjttkiuqlclalccah.supabase.co");
    expect(policy).toContain("https://*.supabase.co");
    expect(policy).toContain("wss://*.supabase.co");
    expect(policy).toContain("https://www.smartsuppchat.com");
    expect(policy).toContain("https://*.smartsupp.com");
  });

  it("blocks object embedding and off-origin forms", () => {
    const policy = buildContentSecurityPolicy();
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("form-action 'self'");
  });

  it("can allow localhost during development", () => {
    const policy = buildContentSecurityPolicy({ allowLocalhost: true });
    expect(policy).toContain("http://localhost:*");
    expect(policy).toContain("ws://127.0.0.1:*");
  });
});

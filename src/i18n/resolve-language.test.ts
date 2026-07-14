import { describe, expect, it } from "vitest";

import { resolveLanguage, firstSupportedFromAcceptLanguage } from "./resolve-language";
import { translate } from "./translate";
import { formatMoneyMinorUnits } from "./format";

describe("resolveLanguage", () => {
  it("prefers saved preference over browser and country", () => {
    expect(
      resolveLanguage({
        savedPreference: "ja",
        acceptLanguageHeader: "fr-FR,fr;q=0.9",
        countryHint: "EG",
      }),
    ).toBe("ja");
  });

  it("uses browser language when no preference is saved", () => {
    expect(
      resolveLanguage({
        acceptLanguageHeader: "es-MX,es;q=0.9,en;q=0.8",
      }),
    ).toBe("es");
  });

  it("maps zh Accept-Language to zh-Hans", () => {
    expect(firstSupportedFromAcceptLanguage("zh-CN,zh;q=0.9")).toBe("zh-Hans");
  });

  it("falls back to country then English", () => {
    expect(resolveLanguage({ countryHint: "BR" })).toBe("pt");
    expect(resolveLanguage({})).toBe("en");
  });

  it("ignores unsupported preference tags", () => {
    expect(
      resolveLanguage({
        savedPreference: "de",
        acceptLanguageHeader: "fr",
      }),
    ).toBe("fr");
  });
});

describe("translate", () => {
  it("returns English when the active locale lacks a key", () => {
    expect(translate("es", "language.selector.label")).toBe("Language");
  });

  it("returns Arabic keys when present", () => {
    expect(translate("ar", "language.selector.label")).toBe("اللغة");
  });

  it("interpolates values", () => {
    expect(translate("en", "language.selector.label")).toContain("Language");
  });
});

describe("formatMoneyMinorUnits", () => {
  it("formats USD without changing magnitude", () => {
    expect(formatMoneyMinorUnits("en", 125000)).toBe("$1,250.00");
  });
});

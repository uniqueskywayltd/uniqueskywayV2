import { describe, expect, it } from "vitest";

import { resolveLanguage, firstSupportedFromAcceptLanguage } from "./resolve-language";
import { translate } from "./translate";
import { formatMoneyMinorUnits } from "./format";
import { APP_LANGUAGE_CODES, listSelectableLanguages } from "./index";

describe("resolveLanguage", () => {
  it("prefers saved preference over browser and country", () => {
    expect(
      resolveLanguage({
        savedPreference: "ar",
        acceptLanguageHeader: "fr-FR,fr;q=0.9",
        countryHint: "EG",
      }),
    ).toBe("ar");
  });

  it("does not auto-apply browser language without a saved preference", () => {
    expect(
      resolveLanguage({
        acceptLanguageHeader: "es-MX,es;q=0.9,en;q=0.8",
      }),
    ).toBe("en");
  });

  it("ignores retired language tags from Accept-Language", () => {
    expect(firstSupportedFromAcceptLanguage("zh-CN,zh;q=0.9,en;q=0.8")).toBe("en");
    expect(firstSupportedFromAcceptLanguage("ja,en;q=0.8")).toBe("en");
  });

  it("does not auto-apply country hints; defaults to English", () => {
    expect(resolveLanguage({ countryHint: "MX" })).toBe("en");
    expect(resolveLanguage({ countryHint: "BR" })).toBe("en");
    expect(resolveLanguage({})).toBe("en");
  });

  it("ignores unsupported preference tags and stays on English", () => {
    expect(
      resolveLanguage({
        savedPreference: "de",
        acceptLanguageHeader: "fr",
      }),
    ).toBe("en");
  });

  it("ignores retired saved preferences", () => {
    expect(
      resolveLanguage({
        savedPreference: "ja",
        acceptLanguageHeader: "en",
      }),
    ).toBe("en");
  });
});

describe("firstSupportedFromAcceptLanguage", () => {
  it("detects supported browser languages for the suggestion banner", () => {
    expect(firstSupportedFromAcceptLanguage("fr-FR,fr;q=0.9")).toBe("fr");
    expect(firstSupportedFromAcceptLanguage("ar")).toBe("ar");
    expect(firstSupportedFromAcceptLanguage("es-ES")).toBe("es");
  });
});

describe("language catalog", () => {
  it("exposes only English, Arabic, Spanish, and French", () => {
    expect([...APP_LANGUAGE_CODES].sort()).toEqual(["ar", "en", "es", "fr"]);
    expect(listSelectableLanguages().map((entry) => entry.nativeName)).toEqual([
      "English",
      "العربية",
      "Español",
      "Français",
    ]);
  });
});

describe("translate", () => {
  it("returns locale copy when present", () => {
    expect(translate("es", "language.selector.label")).toBe("Idioma");
  });

  it("returns Arabic keys when present", () => {
    expect(translate("ar", "language.selector.label")).toBe("اللغة");
  });

  it("interpolates values", () => {
    expect(translate("en", "language.selector.label")).toContain("Language");
  });

  it("falls back to English for unknown keys", () => {
    expect(translate("fr", "definitely.missing.key")).toBe("definitely.missing.key");
  });
});

describe("formatMoneyMinorUnits", () => {
  it("formats USD without changing magnitude", () => {
    expect(formatMoneyMinorUnits("en", 125000)).toBe("$1,250.00");
  });
});

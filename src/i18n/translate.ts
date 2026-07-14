import type { AppLanguage, MessageCatalog } from "./types";
import { enMessages } from "./messages/en";
import { arMessages } from "./messages/ar";

const englishCatalog: MessageCatalog = { ...enMessages };
const arabicCatalog: MessageCatalog = { ...arMessages };

const catalogs: Record<AppLanguage, MessageCatalog> = {
  en: englishCatalog,
  es: englishCatalog,
  fr: englishCatalog,
  ar: arabicCatalog,
  pt: englishCatalog,
  hi: englishCatalog,
  bn: englishCatalog,
  "zh-Hans": englishCatalog,
  ru: englishCatalog,
  ja: englishCatalog,
};

export function loadMessages(language: AppLanguage): MessageCatalog {
  return catalogs[language] ?? englishCatalog;
}

export function translate(
  language: AppLanguage,
  key: string,
  values?: Record<string, string | number>,
): string {
  const catalog = loadMessages(language);
  const template = catalog[key] ?? englishCatalog[key] ?? key;
  if (!values) return template;

  return template.replace(/\{(\w+)\}/g, (_match: string, name: string) => {
    const value = values[name];
    return value === undefined ? `{${name}}` : String(value);
  });
}

export function createTranslator(language: AppLanguage) {
  return (key: string, values?: Record<string, string | number>) =>
    translate(language, key, values);
}

import type { AppLanguage, MessageCatalog } from "./types";
import { arMessages } from "./messages/ar";
import { bnMessages } from "./messages/bn";
import { enMessages } from "./messages/en";
import { esMessages } from "./messages/es";
import { frMessages } from "./messages/fr";
import { hiMessages } from "./messages/hi";
import { jaMessages } from "./messages/ja";
import { ptMessages } from "./messages/pt";
import { ruMessages } from "./messages/ru";
import { zhHansMessages } from "./messages/zh-Hans";

const catalogs: Record<AppLanguage, MessageCatalog> = {
  en: enMessages,
  es: esMessages,
  fr: frMessages,
  ar: arMessages,
  pt: ptMessages,
  hi: hiMessages,
  bn: bnMessages,
  "zh-Hans": zhHansMessages,
  ru: ruMessages,
  ja: jaMessages,
};

export function loadMessages(language: AppLanguage): MessageCatalog {
  return catalogs[language] ?? enMessages;
}

export function translate(
  language: AppLanguage,
  key: string,
  values?: Record<string, string | number>,
): string {
  const catalog = loadMessages(language);
  const template = catalog[key] ?? enMessages[key as keyof typeof enMessages] ?? key;
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

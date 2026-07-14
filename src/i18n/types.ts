export const APP_LANGUAGE_CODES = [
  "en",
  "es",
  "fr",
  "ar",
  "pt",
  "hi",
  "bn",
  "zh-Hans",
  "ru",
  "ja",
] as const;

export type AppLanguage = (typeof APP_LANGUAGE_CODES)[number];

export type MessageCatalog = Record<string, string>;

export const LANGUAGE_COOKIE_NAME = "usw_language";

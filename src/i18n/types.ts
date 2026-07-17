export const APP_LANGUAGE_CODES = ["en", "es", "fr", "ar"] as const;

export type AppLanguage = (typeof APP_LANGUAGE_CODES)[number];

export type MessageCatalog = Record<string, string>;

export const LANGUAGE_COOKIE_NAME = "usw_language";

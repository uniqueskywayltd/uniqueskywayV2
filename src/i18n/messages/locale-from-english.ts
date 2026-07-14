/**
 * Message overlays per locale. English base is in `en.ts`.
 * Each locale spreads English then overrides — financial figures stay code-side.
 */
import type { MessageCatalog } from "../types";
import { enMessages } from "./en";

export function localeFromEnglish(overrides: MessageCatalog): MessageCatalog {
  return { ...enMessages, ...overrides };
}

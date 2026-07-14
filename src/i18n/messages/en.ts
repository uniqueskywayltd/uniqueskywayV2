import type { MessageCatalog } from "../types";

/** Canonical English catalog (DEC-0061). Infrastructure keys for Sprint I1. */
export const enMessages = {
  "language.selector.label": "Language",
  "language.selector.change": "Change language",
  "chrome.notifications": "Notifications",
  "chrome.account": "Account",
  "chrome.skip_to_content": "Skip to main content",
} as const satisfies MessageCatalog;

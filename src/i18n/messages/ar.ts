import type { MessageCatalog } from "../types";

/** Minimal Arabic catalog for I1 RTL / selector verification. Falls back to English for missing keys. */
export const arMessages = {
  "language.selector.label": "اللغة",
  "language.selector.change": "تغيير اللغة",
  "chrome.notifications": "الإشعارات",
  "chrome.account": "الحساب",
  "chrome.skip_to_content": "تخطى إلى المحتوى الرئيسي",
} as const satisfies MessageCatalog;

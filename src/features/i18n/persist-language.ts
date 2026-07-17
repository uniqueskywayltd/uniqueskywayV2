"use client";

import { getLanguageDirection, LANGUAGE_COOKIE_NAME, type AppLanguage } from "@/i18n";
import { appPath } from "@/lib/app-path";

const LANGUAGE_EXPLICIT_COOKIE = "usw_language_explicit";
const SUGGEST_DISMISS_SESSION_KEY = "usw_lang_suggest_dismissed";

export { LANGUAGE_EXPLICIT_COOKIE, SUGGEST_DISMISS_SESSION_KEY };

async function getCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch(appPath("/api/auth/csrf"), { credentials: "include" });
    if (!response.ok) return null;
    const payload = (await response.json()) as { data?: { csrfToken?: string } };
    return payload.data?.csrfToken ?? null;
  } catch {
    return null;
  }
}

function cookieSecureSuffix(): string {
  return typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
}

export function writeLanguageCookie(language: AppLanguage, { explicit = true } = {}) {
  const maxAge = 60 * 60 * 24 * 365;
  const secure = cookieSecureSuffix();
  document.cookie = `${LANGUAGE_COOKIE_NAME}=${encodeURIComponent(language)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  if (explicit) {
    document.cookie = `${LANGUAGE_EXPLICIT_COOKIE}=1; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  }
}

export function applyDocumentLanguage(language: AppLanguage) {
  document.documentElement.lang = language;
  document.documentElement.dir = getLanguageDirection(language);
}

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

export function hasExplicitLanguagePreference(): boolean {
  return Boolean(readCookie(LANGUAGE_COOKIE_NAME) || readCookie(LANGUAGE_EXPLICIT_COOKIE));
}

export function isLanguageSuggestionDismissed(): boolean {
  try {
    return sessionStorage.getItem(SUGGEST_DISMISS_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissLanguageSuggestionForSession() {
  try {
    sessionStorage.setItem(SUGGEST_DISMISS_SESSION_KEY, "1");
  } catch {
    // private mode / blocked storage
  }
}

/** Persist language locally and sync to the server when possible. */
export async function persistLanguageChoice(language: AppLanguage): Promise<void> {
  writeLanguageCookie(language, { explicit: true });
  applyDocumentLanguage(language);

  try {
    const csrfToken = await getCsrfToken();
    if (!csrfToken) return;
    await fetch(appPath("/api/locale"), {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({ language }),
    });
  } catch {
    // Cookie + document language already applied.
  }
}

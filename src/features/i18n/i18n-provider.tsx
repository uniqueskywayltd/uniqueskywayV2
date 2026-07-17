"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { createTranslator, getLanguageDirection, isAppLanguage, type AppLanguage } from "@/i18n";

type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  initialLanguage,
  children,
  syncDocument = true,
}: {
  initialLanguage: AppLanguage;
  children: ReactNode;
  /** When false, nested providers (e.g. admin English lock) do not rewrite document lang/dir. */
  syncDocument?: boolean;
}) {
  const [override, setOverride] = useState<AppLanguage | null>(null);
  const language = override ?? initialLanguage;

  useEffect(() => {
    if (!syncDocument) return;
    document.documentElement.lang = language;
    document.documentElement.dir = getLanguageDirection(language);
  }, [language, syncDocument]);

  const setLanguage = useCallback((next: AppLanguage) => {
    if (!isAppLanguage(next)) return;
    setOverride(next);
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const translator = createTranslator(language);
    return {
      language,
      setLanguage,
      t: translator,
    };
  }, [language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

export function useOptionalI18n() {
  return useContext(I18nContext);
}

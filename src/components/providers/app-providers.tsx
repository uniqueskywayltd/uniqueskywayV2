"use client";

import type { ReactNode } from "react";

import { SmartsuppChat } from "@/components/providers/smartsupp-chat";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { I18nProvider } from "@/features/i18n/i18n-provider";
import { SocialProofToasts } from "@/features/public/components/social-proof-toasts";
import type { AppLanguage } from "@/i18n";

export function AppProviders({
  language,
  children,
}: {
  language: AppLanguage;
  children: ReactNode;
}) {
  return (
    <ThemeProvider>
      <I18nProvider initialLanguage={language}>
        {children}
        <SocialProofToasts />
        <SmartsuppChat />
      </I18nProvider>
    </ThemeProvider>
  );
}

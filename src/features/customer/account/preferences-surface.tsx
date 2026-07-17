"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Settings2 } from "lucide-react";

import { listSelectableLanguages, type AppLanguage, isAppLanguage } from "@/i18n";
import { writeLanguageCookie } from "@/features/i18n/persist-language";
import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@/components/ui";
import { AccountReveal } from "@/features/customer/account/account-motion";
import { AccountSurfaceNav } from "@/features/customer/account/account-surface-nav";
import { AccountWelcomeHero } from "@/features/customer/account/account-welcome-hero";
import { getCustomerJson, patchCustomerJson } from "@/features/customer/api-client";
import { useI18n } from "@/features/i18n/i18n-provider";
import type { CustomerSummary } from "@/features/customer/types";

function PreferencesFrameSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-8 sm:space-y-9" aria-busy="true" aria-label={label}>
      <Skeleton className="h-36 w-full rounded-2xl sm:h-40" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={`nav-${index}`} className="h-8 w-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-56 w-full rounded-2xl" />
      <Skeleton className="h-56 w-full rounded-2xl" />
    </div>
  );
}

/** Preferences — theme, language (I1), notifications, timezone from certified APIs. */
export function PreferencesSurface() {
  const { t } = useI18n();
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [appearance, setAppearance] = useState("system");
  const [language, setLanguage] = useState("en");
  const [timeZone, setTimeZone] = useState("America/New_York");
  const [emailSecurity, setEmailSecurity] = useState(true);
  const [emailProduct, setEmailProduct] = useState(true);
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [inApp, setInApp] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getCustomerJson<CustomerSummary>("/api/customer/summary").then((result) => {
      if (!active) return;
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      const next = result.data ?? null;
      setSummary(next);
      if (next) {
        setAppearance(next.preferences.appearance);
        setLanguage(next.preferences.language);
        setTimeZone(next.preferences.timeZone);
        setInApp(next.preferences.inAppNotificationsEnabled);
        setEmailSecurity(next.preferences.securityEmailsEnabled);
        setEmailProduct(next.preferences.productEmailsEnabled);
        setEmailMarketing(next.preferences.marketingEmailsEnabled);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    setPending(true);
    setError(null);
    setMessage(null);

    const result = await patchCustomerJson("/api/customer/preferences", {
      appearance,
      language,
      timeZone,
      inAppNotificationsEnabled: inApp,
      securityEmailsEnabled: emailSecurity,
      productEmailsEnabled: emailProduct,
      marketingEmailsEnabled: emailMarketing,
    });

    if (result.error) setError(result.error);
    else {
      setMessage(t("settings.saved"));
      if (typeof document !== "undefined" && isAppLanguage(language)) {
        writeLanguageCookie(language as AppLanguage, { explicit: true });
      }
    }
    setPending(false);
  }

  if (loading) return <PreferencesFrameSkeleton label={t("settings.loading")} />;

  if (error && !summary) {
    return (
      <div className="space-y-8 sm:space-y-9">
        <AccountWelcomeHero
          title={t("profile.preferences")}
          description={t("settings.hero_description")}
          icon={Settings2}
          accentClassName="bg-teal-500/10 text-teal-800 ring-teal-500/20 dark:text-teal-400"
          barClassName="via-teal-500/70"
          ariaLabel={t("settings.header_aria")}
        />
        <section
          className="rounded-xl border border-destructive/40 bg-destructive/5 p-6"
          role="alert"
        >
          <h2 className="text-base font-semibold text-destructive">{t("settings.unavailable")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/contact">{t("wallet.contact_support")}</Link>
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-9">
      <AccountReveal>
        <AccountWelcomeHero
          title={t("profile.preferences")}
          description={t("settings.hero_description")}
          icon={Settings2}
          accentClassName="bg-teal-500/10 text-teal-800 ring-teal-500/20 dark:text-teal-400"
          barClassName="via-teal-500/70"
          ariaLabel={t("settings.header_aria")}
        />
      </AccountReveal>

      <AccountReveal delayMs={40}>
        <AccountSurfaceNav />
      </AccountReveal>

      <AccountReveal delayMs={80}>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t("settings.display")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("settings.display_desc")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="appearance">{t("settings.theme")}</Label>
              <Select value={appearance} onValueChange={setAppearance}>
                <SelectTrigger id="appearance" aria-label={t("settings.theme")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">{t("settings.theme_system")}</SelectItem>
                  <SelectItem value="light">{t("settings.theme_light")}</SelectItem>
                  <SelectItem value="dark">{t("settings.theme_dark")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("profile.language")}</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger aria-label={t("profile.language")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {listSelectableLanguages().map((entry) => (
                      <SelectItem key={entry.code} value={entry.code}>
                        {entry.nativeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("settings.timezone")}</Label>
                <Select value={timeZone} onValueChange={setTimeZone}>
                  <SelectTrigger aria-label={t("settings.timezone")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">
                      {t("settings.timezone_new_york")}
                    </SelectItem>
                    <SelectItem value="America/Los_Angeles">
                      {t("settings.timezone_los_angeles")}
                    </SelectItem>
                    <SelectItem value="Europe/London">{t("settings.timezone_london")}</SelectItem>
                    <SelectItem value="Africa/Lagos">{t("settings.timezone_lagos")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {t("settings.notification_prefs")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("settings.notification_prefs_desc")}
              </p>
            </div>
            <PreferenceToggle
              id="inApp"
              label={t("settings.in_app")}
              checked={inApp}
              onCheckedChange={setInApp}
            />
            <PreferenceToggle
              id="securityEmail"
              label={t("settings.security_emails")}
              checked={emailSecurity}
              onCheckedChange={setEmailSecurity}
            />
            <PreferenceToggle
              id="productEmail"
              label={t("settings.product_emails")}
              checked={emailProduct}
              onCheckedChange={setEmailProduct}
            />
            <PreferenceToggle
              id="marketingEmail"
              label={t("settings.marketing_emails")}
              checked={emailMarketing}
              onCheckedChange={setEmailMarketing}
            />
          </section>
        </div>
      </AccountReveal>

      <AccountReveal delayMs={100}>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {message ? (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
        <Button type="button" onClick={() => void save()} disabled={pending || !summary}>
          {pending ? t("settings.saving") : t("settings.save_preferences")}
        </Button>
      </AccountReveal>
    </div>
  );
}

function PreferenceToggle({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
      <Label htmlFor={id}>{label}</Label>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
    </div>
  );
}

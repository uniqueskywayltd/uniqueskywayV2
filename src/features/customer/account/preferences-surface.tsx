"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Settings2 } from "lucide-react";

import { LANGUAGE_COOKIE_NAME, listSelectableLanguages } from "@/i18n";
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
import type { CustomerSummary } from "@/features/customer/types";

function PreferencesFrameSkeleton() {
  return (
    <div className="space-y-8 sm:space-y-9" aria-busy="true" aria-label="Loading preferences">
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
      setMessage("Preferences saved.");
      if (typeof document !== "undefined") {
        document.cookie = `${LANGUAGE_COOKIE_NAME}=${encodeURIComponent(language)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      }
    }
    setPending(false);
  }

  if (loading) return <PreferencesFrameSkeleton />;

  if (error && !summary) {
    return (
      <div className="space-y-8 sm:space-y-9">
        <AccountWelcomeHero
          title="Preferences"
          description="What do I control about my account? Display, language, and how we reach you."
          icon={Settings2}
          accentClassName="bg-teal-500/10 text-teal-800 ring-teal-500/20 dark:text-teal-400"
          barClassName="via-teal-500/70"
          ariaLabel="Preferences header"
        />
        <section
          className="rounded-xl border border-destructive/40 bg-destructive/5 p-6"
          role="alert"
        >
          <h2 className="text-base font-semibold text-destructive">Preferences unavailable</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/contact">Contact support</Link>
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-9">
      <AccountReveal>
        <AccountWelcomeHero
          title="Preferences"
          description="What do I control about my account? Display, language, and how we reach you."
          icon={Settings2}
          accentClassName="bg-teal-500/10 text-teal-800 ring-teal-500/20 dark:text-teal-400"
          barClassName="via-teal-500/70"
          ariaLabel="Preferences header"
        />
      </AccountReveal>

      <AccountReveal delayMs={40}>
        <AccountSurfaceNav />
      </AccountReveal>

      <AccountReveal delayMs={80}>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Display</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Theme preference for this account. Language uses existing I1 infrastructure.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="appearance">Theme</Label>
              <Select value={appearance} onValueChange={setAppearance}>
                <SelectTrigger id="appearance" aria-label="Appearance preference">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger aria-label="Language preference">
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
                <Label>Time zone</Label>
                <Select value={timeZone} onValueChange={setTimeZone}>
                  <SelectTrigger aria-label="Time zone preference">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">New York</SelectItem>
                    <SelectItem value="America/Los_Angeles">Los Angeles</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Africa/Lagos">Lagos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Notification preferences</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Control non-financial communication channels stored on your preference record.
              </p>
            </div>
            <PreferenceToggle
              id="inApp"
              label="In-app notifications"
              checked={inApp}
              onCheckedChange={setInApp}
            />
            <PreferenceToggle
              id="securityEmail"
              label="Security emails"
              checked={emailSecurity}
              onCheckedChange={setEmailSecurity}
            />
            <PreferenceToggle
              id="productEmail"
              label="Product emails"
              checked={emailProduct}
              onCheckedChange={setEmailProduct}
            />
            <PreferenceToggle
              id="marketingEmail"
              label="Marketing emails"
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
          {pending ? "Saving" : "Save preferences"}
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

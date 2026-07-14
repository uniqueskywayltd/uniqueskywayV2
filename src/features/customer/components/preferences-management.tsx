"use client";

import { useEffect, useState } from "react";

import { LANGUAGE_COOKIE_NAME, listSelectableLanguages } from "@/i18n";
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

import { getCustomerJson, patchCustomerJson } from "../api-client";
import type { CustomerSummary } from "../types";

export function PreferencesManagement() {
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

  useEffect(() => {
    let active = true;
    void getCustomerJson<CustomerSummary>("/api/customer/summary").then((result) => {
      if (!active) return;
      if (result.error) {
        setError(result.error);
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

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Display preferences are architecture-ready for future theming.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={appearance} onValueChange={setAppearance}>
            <SelectTrigger aria-label="Appearance preference">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email and notifications</CardTitle>
          <CardDescription>Control non-financial communication preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
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
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive" className="lg:col-span-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {message ? (
        <Alert className="lg:col-span-2">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <div className="lg:col-span-2">
        <Button type="button" onClick={() => void save()} disabled={pending || !summary}>
          {pending ? "Saving" : "Save preferences"}
        </Button>
      </div>
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
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <Label htmlFor={id}>{label}</Label>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
    </div>
  );
}

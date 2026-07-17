"use client";

/* Admin settings load after mount; draft updates follow async fetches. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  Button,
  Card,
  Checkbox,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/utils";

import { getAdminJson, mutateAdminJson } from "../api-client";
import {
  AdminEmptyBlock,
  AdminErrorBlock,
  AdminLoadingBlock,
  AdminPageHeader,
} from "./admin-states";

type LoadState = "loading" | "ready" | "error";

type SettingRow = {
  key: string;
  value: unknown;
  description: string | null;
};

type PasswordPolicy = {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSymbol: boolean;
};

type EmailActivity = {
  lastSuccess: string | null;
  lastFailure: string | null;
  status: string;
};

const OTP_EXPIRY_OPTIONS = [
  { value: 5, label: "5 Minutes" },
  { value: 10, label: "10 Minutes" },
  { value: 15, label: "15 Minutes" },
  { value: 30, label: "30 Minutes" },
  { value: 60, label: "60 Minutes" },
] as const;

const OTP_LENGTH_OPTIONS = [
  { value: 6, label: "6 Digits" },
  { value: 7, label: "7 Digits" },
  { value: 8, label: "8 Digits" },
] as const;

const PASSWORD_LENGTH_OPTIONS = [
  { value: 8, label: "8" },
  { value: 10, label: "10" },
  { value: 12, label: "12" },
  { value: 14, label: "14" },
] as const;

const SESSION_TIMEOUT_OPTIONS = [
  { value: 15, label: "15 Minutes" },
  { value: 30, label: "30 Minutes" },
  { value: 60, label: "1 Hour" },
  { value: 240, label: "4 Hours" },
  { value: 480, label: "8 Hours" },
  { value: 1440, label: "24 Hours" },
  { value: 10080, label: "7 Days" },
] as const;

const SETTLEMENT_TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "America/New_York" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "London" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Singapore", label: "Singapore" },
] as const;

const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "AED", "SGD"] as const;

export function SettingsPanel() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [search, setSearch] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [emailActivity, setEmailActivity] = useState<EmailActivity>({
    lastSuccess: null,
    lastFailure: null,
    status: "Ready",
  });

  const load = useCallback(async () => {
    const [settingsResult, flagsResult] = await Promise.all([
      getAdminJson<{ settings: SettingRow[] }>("/api/admin/settings"),
      getAdminJson<{
        featureFlags: Array<{ key: string; status: string }>;
      }>("/api/admin/feature-flags"),
    ]);

    if (settingsResult.error) {
      setError({
        message: settingsResult.error,
        ...(settingsResult.status ? { status: settingsResult.status } : {}),
      });
      setState("error");
      return;
    }

    const next: Record<string, unknown> = {};
    for (const row of settingsResult.data?.settings ?? []) {
      next[row.key] = row.value;
    }
    setSettings(next);

    const support = asString(next["platform.support_email"], "info@uniqueskyway.com");
    setTestEmail((current) => current || support);

    if (!flagsResult.error) {
      const maintenance = (flagsResult.data?.featureFlags ?? []).find(
        (flag) => flag.key === "maintenance_mode",
      );
      setMaintenanceEnabled(maintenance?.status === "enabled");
      const emailDelivery = (flagsResult.data?.featureFlags ?? []).find(
        (flag) => flag.key === "email_delivery_enabled",
      );
      setEmailActivity((current) => ({
        ...current,
        status:
          emailDelivery?.status === "disabled"
            ? "Paused"
            : emailDelivery?.status === "enabled"
              ? "Operational"
              : current.status,
      }));
    }

    setState("ready");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function showSaved() {
    setFeedback("✅ Settings Saved Successfully");
    window.setTimeout(() => setFeedback(null), 3200);
  }

  async function saveValue(
    key: string,
    value: string | number | boolean | Record<string, unknown>,
  ) {
    setBusyKey(key);
    setFeedback(null);
    const result = await mutateAdminJson("POST", "/api/admin/settings", { key, value });
    setBusyKey(null);
    if (result.error) {
      setFeedback(result.error);
      return false;
    }
    setSettings((current) => ({ ...current, [key]: value }));
    showSaved();
    return true;
  }

  async function savePasswordPolicy(next: PasswordPolicy) {
    return saveValue("auth.password_policy", next);
  }

  async function saveCurrency(currency: string) {
    setBusyKey("platform.currency");
    setFeedback(null);
    const primary = await mutateAdminJson("POST", "/api/admin/settings", {
      key: "platform.currency",
      value: currency,
    });
    if (primary.error) {
      setBusyKey(null);
      setFeedback(primary.error);
      return;
    }
    const nested = await mutateAdminJson("POST", "/api/admin/settings", {
      key: "platform.default_currency",
      value: { currency },
    });
    setBusyKey(null);
    if (nested.error) {
      setFeedback(nested.error);
      return;
    }
    setSettings((current) => ({
      ...current,
      "platform.currency": currency,
      "platform.default_currency": { currency },
    }));
    showSaved();
  }

  async function saveSettlementTimezone(timezone: string) {
    return saveValue("settlement.timezone", { timezone });
  }

  async function saveOtpLength(length: number) {
    const existing = settings["auth.otp_length"];
    if (existing && typeof existing === "object" && !Array.isArray(existing)) {
      return saveValue("auth.otp_length", {
        ...(existing as Record<string, unknown>),
        min: length,
        max: length,
      });
    }
    return saveValue("auth.otp_length", length);
  }

  async function saveFromIdentity(fromName: string, fromEmail: string) {
    const composed = `${fromName.trim()} <${fromEmail.trim()}>`;
    return saveValue("email.from_display", composed);
  }

  async function saveMaintenanceMode(enabled: boolean) {
    setBusyKey("maintenance_mode");
    setFeedback(null);
    const result = await mutateAdminJson("POST", "/api/admin/feature-flags", {
      key: "maintenance_mode",
      status: enabled ? "enabled" : "disabled",
      description: "Puts the platform into maintenance mode.",
    });
    setBusyKey(null);
    if (result.error) {
      setFeedback(result.error);
      return;
    }
    setMaintenanceEnabled(enabled);
    showSaved();
  }

  async function sendTestEmail() {
    const toEmail = testEmail.trim().toLowerCase();
    if (!toEmail.includes("@")) {
      setFeedback("Enter a valid email address for the test message.");
      return;
    }
    setBusyKey("email.test");
    setFeedback(null);
    const result = await mutateAdminJson<{ queued?: boolean }>(
      "POST",
      `/api/admin/email-templates/${encodeURIComponent("auth.welcome")}/test`,
      { toEmail },
    );
    setBusyKey(null);
    const stamp = new Date().toLocaleString();
    if (result.error) {
      setEmailActivity((current) => ({
        ...current,
        lastFailure: stamp,
        status: "Needs attention",
      }));
      setFeedback(result.error);
      return;
    }
    setEmailActivity((current) => ({
      ...current,
      lastSuccess: stamp,
      status: "Operational",
    }));
    setFeedback("✅ Settings Saved Successfully");
    window.setTimeout(() => setFeedback(null), 3200);
  }

  const passwordPolicy = useMemo(
    () => readPasswordPolicy(settings["auth.password_policy"]),
    [settings],
  );
  const fromIdentity = useMemo(
    () =>
      parseFromDisplay(
        asString(settings["email.from_display"], "Unique Sky Way <info@uniqueskyway.com>"),
      ),
    [settings],
  );
  const otpLength = readOtpLength(settings["auth.otp_length"]);
  const settlementTimezone = readNestedString(
    settings["settlement.timezone"],
    "timezone",
    asString(settings["platform.timezone"], "America/New_York"),
  );
  const roiVersion = readNestedString(
    settings["settlement.roi_formula_version"],
    "version",
    "roi-v1",
  );

  const query = search.trim().toLowerCase();
  const sectionVisible = (section: string, fields: string[]) => {
    if (!query) return true;
    if (section.toLowerCase().includes(query)) return true;
    return fields.some((field) => field.toLowerCase().includes(query));
  };

  if (state === "loading") return <AdminLoadingBlock label="Loading settings" />;
  if (state === "error" && error) {
    return (
      <AdminErrorBlock
        message={error.message}
        {...(error.status ? { status: error.status } : {})}
        onRetry={() => {
          setState("loading");
          void load();
        }}
      />
    );
  }

  if (state === "ready" && Object.keys(settings).length === 0) {
    return <AdminEmptyBlock title="No settings available" />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Settings"
        description="Manage your business platform options. Changes apply without leaving this page."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search Settings..."
          aria-label="Search settings"
          className="max-w-md"
        />
        {feedback ? (
          <p className="text-sm font-medium text-foreground" role="status">
            {feedback}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Tip: each card includes a short explanation.
          </p>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {sectionVisible("company information", [
          "platform name",
          "company name",
          "support email",
          "sender email",
          "reply-to",
          "phone",
          "country",
          "currency",
          "timezone",
          "business hours",
        ]) ? (
          <SectionCard title="🏢 Company Information" className="lg:col-span-2">
            <div className="grid gap-4 md:grid-cols-2">
              <TextSetting
                title="Platform Name"
                description="The brand name customers see across the investor portal."
                value={asString(settings["platform.name"])}
                busy={busyKey === "platform.name"}
                onSave={(value) => void saveValue("platform.name", value)}
              />
              <TextSetting
                title="Company Name"
                description="Legal or trading name used for company identity."
                value={asString(settings["platform.company_name"])}
                busy={busyKey === "platform.company_name"}
                onSave={(value) => void saveValue("platform.company_name", value)}
              />
              <TextSetting
                title="Support Email"
                description="Where customers send help requests."
                value={asString(settings["platform.support_email"])}
                busy={busyKey === "platform.support_email"}
                onSave={(value) => void saveValue("platform.support_email", value)}
              />
              <TextSetting
                title="Sender Email"
                description="The address used to send platform emails."
                value={asString(settings["platform.sender_email"])}
                busy={busyKey === "platform.sender_email"}
                onSave={(value) => void saveValue("platform.sender_email", value)}
              />
              <TextSetting
                title="Reply-To Email"
                description="Where replies to platform emails are delivered."
                value={asString(settings["email.reply_to"])}
                busy={busyKey === "email.reply_to"}
                onSave={(value) => void saveValue("email.reply_to", value)}
              />
              <TextSetting
                title="Support Phone Number"
                description="Optional phone number shown for customer support."
                value={asString(settings["platform.phone"])}
                busy={busyKey === "platform.phone"}
                onSave={(value) => void saveValue("platform.phone", value)}
              />
              <TextSetting
                title="Country"
                description="Default country for platform operations."
                value={asString(settings["platform.country"], "US")}
                busy={busyKey === "platform.country"}
                onSave={(value) => void saveValue("platform.country", value)}
              />
              <SelectSetting
                title="Default Currency"
                description="Currency used for balances, deposits, and investments."
                value={asString(settings["platform.currency"], "USD")}
                options={CURRENCY_OPTIONS.map((currency) => ({
                  value: currency,
                  label: currency,
                }))}
                busy={busyKey === "platform.currency"}
                onSave={(value) => void saveCurrency(value)}
              />
              <SelectSetting
                title="Timezone"
                description="Default timezone for business hours and admin scheduling."
                value={asString(settings["platform.timezone"], "America/New_York")}
                options={SETTLEMENT_TIMEZONE_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                busy={busyKey === "platform.timezone"}
                onSave={(value) => void saveValue("platform.timezone", value)}
              />
              <TextSetting
                title="Business Hours"
                description="These hours are shown to customers on the Contact page."
                value={asString(settings["platform.business_hours"])}
                busy={busyKey === "platform.business_hours"}
                onSave={(value) => void saveValue("platform.business_hours", value)}
                multiline
              />
            </div>
          </SectionCard>
        ) : null}

        {sectionVisible("login security otp password logout", [
          "verification code",
          "password",
          "automatic logout",
          "otp",
        ]) ? (
          <SectionCard title="🔐 Login & Security" className="lg:col-span-2">
            <div className="grid gap-4 md:grid-cols-2">
              <SelectSetting
                title="Verification Code Valid For"
                description="Choose how long customers have to enter the verification code before it expires."
                value={String(asNumber(settings["auth.otp_expiry_minutes"], 15))}
                options={OTP_EXPIRY_OPTIONS.map((option) => ({
                  value: String(option.value),
                  label: option.label,
                }))}
                busy={busyKey === "auth.otp_expiry_minutes"}
                onSave={(value) => void saveValue("auth.otp_expiry_minutes", Number(value))}
              />
              <SelectSetting
                title="Verification Code Length"
                description="Choose how many digits appear in customer verification codes."
                value={String(otpLength)}
                options={OTP_LENGTH_OPTIONS.map((option) => ({
                  value: String(option.value),
                  label: option.label,
                }))}
                busy={busyKey === "auth.otp_length"}
                onSave={(value) => void saveOtpLength(Number(value))}
              />
              <SelectSetting
                title="Minimum Password Length"
                description="Set the shortest password customers and staff may use."
                value={String(passwordPolicy.minLength)}
                options={PASSWORD_LENGTH_OPTIONS.map((option) => ({
                  value: String(option.value),
                  label: option.label,
                }))}
                busy={busyKey === "auth.password_policy"}
                onSave={(value) =>
                  void savePasswordPolicy({
                    ...passwordPolicy,
                    minLength: Number(value),
                  })
                }
              />
              <SelectSetting
                title="Automatically Sign Out Inactive Users After"
                description="Choose how long users can remain inactive before they are automatically signed out."
                value={String(asNumber(settings["auth.session_timeout_minutes"], 10080))}
                options={withCurrentOption(
                  SESSION_TIMEOUT_OPTIONS.map((option) => ({
                    value: String(option.value),
                    label: option.label,
                  })),
                  String(asNumber(settings["auth.session_timeout_minutes"], 10080)),
                )}
                busy={busyKey === "auth.session_timeout_minutes"}
                onSave={(value) => void saveValue("auth.session_timeout_minutes", Number(value))}
              />
            </div>

            <div className="mt-4 rounded-xl border border-border/70 bg-muted/20 p-4">
              <h3 className="text-sm font-semibold">Password Requirements</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose the rules every new password must follow.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <PolicyCheckbox
                  label="Require Uppercase"
                  checked={passwordPolicy.requireUppercase}
                  disabled={busyKey === "auth.password_policy"}
                  onChange={(checked) =>
                    void savePasswordPolicy({ ...passwordPolicy, requireUppercase: checked })
                  }
                />
                <PolicyCheckbox
                  label="Require Lowercase"
                  checked={passwordPolicy.requireLowercase}
                  disabled={busyKey === "auth.password_policy"}
                  onChange={(checked) =>
                    void savePasswordPolicy({ ...passwordPolicy, requireLowercase: checked })
                  }
                />
                <PolicyCheckbox
                  label="Require Number"
                  checked={passwordPolicy.requireNumber}
                  disabled={busyKey === "auth.password_policy"}
                  onChange={(checked) =>
                    void savePasswordPolicy({ ...passwordPolicy, requireNumber: checked })
                  }
                />
                <PolicyCheckbox
                  label="Require Special Character"
                  checked={passwordPolicy.requireSymbol}
                  disabled={busyKey === "auth.password_policy"}
                  onChange={(checked) =>
                    void savePasswordPolicy({ ...passwordPolicy, requireSymbol: checked })
                  }
                />
              </div>
            </div>
          </SectionCard>
        ) : null}

        {sectionVisible("email settings from reply support test", [
          "from name",
          "from email",
          "reply-to",
          "support email",
          "test email",
        ]) ? (
          <SectionCard title="📧 Email Settings">
            <div className="grid gap-4">
              <TextSetting
                title="From Name"
                description="The sender name customers see in their inbox."
                value={fromIdentity.name}
                busy={busyKey === "email.from_display"}
                onSave={(value) => void saveFromIdentity(value, fromIdentity.email)}
              />
              <TextSetting
                title="From Email"
                description="The sender email address used for platform messages."
                value={fromIdentity.email}
                busy={busyKey === "email.from_display"}
                onSave={(value) => void saveFromIdentity(fromIdentity.name, value)}
              />
              <TextSetting
                title="Reply-To Email"
                description="Where replies to platform emails are delivered."
                value={asString(settings["email.reply_to"])}
                busy={busyKey === "email.reply_to"}
                onSave={(value) => void saveValue("email.reply_to", value)}
              />
              <TextSetting
                title="Support Email"
                description="Shown to customers as the help contact address."
                value={asString(settings["platform.support_email"])}
                busy={busyKey === "platform.support_email"}
                onSave={(value) => void saveValue("platform.support_email", value)}
              />

              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <h3 className="text-sm font-semibold">Send Test Email</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Send a sample welcome email to confirm delivery is working.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="email"
                    value={testEmail}
                    onChange={(event) => setTestEmail(event.target.value)}
                    placeholder="you@company.com"
                    aria-label="Test email recipient"
                  />
                  <Button
                    type="button"
                    disabled={busyKey === "email.test"}
                    onClick={() => void sendTestEmail()}
                  >
                    {busyKey === "email.test" ? "Sending…" : "Send Test Email"}
                  </Button>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <StatusRow
                    label="Last Successful Email"
                    value={emailActivity.lastSuccess ?? "—"}
                  />
                  <StatusRow label="Last Failed Email" value={emailActivity.lastFailure ?? "—"} />
                  <StatusRow label="Email Status" value={emailActivity.status} />
                </dl>
              </div>
            </div>
          </SectionCard>
        ) : null}

        {sectionVisible("investment settings settlement timezone roi formula", [
          "settlement timezone",
          "roi",
          "formula",
        ]) ? (
          <SectionCard title="💰 Investment Settings">
            <div className="grid gap-4">
              <SelectSetting
                title="Settlement Timezone"
                description="Daily investment earnings settle according to this timezone."
                value={settlementTimezone}
                options={withCurrentOption(
                  SETTLEMENT_TIMEZONE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  })),
                  settlementTimezone,
                )}
                busy={busyKey === "settlement.timezone"}
                onSave={(value) => void saveSettlementTimezone(value)}
              />
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <h3 className="text-sm font-semibold">Current Formula</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  ROI is calculated with the certified investment formula. This cannot be edited
                  here.
                </p>
                <p className="mt-3 text-base font-medium">
                  {roiVersion === "roi-v1" || roiVersion === "1" ? "Version 1" : roiVersion}
                </p>
              </div>
            </div>
          </SectionCard>
        ) : null}

        {sectionVisible("platform settings maintenance banner currency country", [
          "platform name",
          "maintenance",
          "currency",
          "country",
        ]) ? (
          <SectionCard title="🛠 Platform Settings" className="lg:col-span-2">
            <div className="grid gap-4 md:grid-cols-2">
              <TextSetting
                title="Platform Name"
                description="Public product name shown in the customer experience."
                value={asString(settings["platform.name"])}
                busy={busyKey === "platform.name"}
                onSave={(value) => void saveValue("platform.name", value)}
              />
              <TextSetting
                title="Maintenance Banner"
                description="Optional message shown when you need to notify customers about maintenance."
                value={asString(settings["platform.maintenance_banner"])}
                busy={busyKey === "platform.maintenance_banner"}
                onSave={(value) => void saveValue("platform.maintenance_banner", value)}
                multiline
              />
              <SelectSetting
                title="Platform Currency"
                description="Primary currency for the platform wallet and reporting."
                value={asString(settings["platform.currency"], "USD")}
                options={CURRENCY_OPTIONS.map((currency) => ({
                  value: currency,
                  label: currency,
                }))}
                busy={busyKey === "platform.currency"}
                onSave={(value) => void saveCurrency(value)}
              />
              <TextSetting
                title="Platform Country"
                description="Default country used for platform configuration."
                value={asString(settings["platform.country"], "US")}
                busy={busyKey === "platform.country"}
                onSave={(value) => void saveValue("platform.country", value)}
              />
              <div className="rounded-xl border border-border/70 bg-muted/20 p-4 md:col-span-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Maintenance Mode</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Temporarily pause customer access while you perform maintenance.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={maintenanceEnabled ? "destructive" : "outline"}
                    disabled={busyKey === "maintenance_mode"}
                    onClick={() => void saveMaintenanceMode(!maintenanceEnabled)}
                  >
                    {busyKey === "maintenance_mode"
                      ? "Saving…"
                      : maintenanceEnabled
                        ? "Turn Off Maintenance"
                        : "Turn On Maintenance"}
                  </Button>
                </div>
                <p className="mt-3 text-sm font-medium">
                  Status: {maintenanceEnabled ? "On" : "Off"}
                </p>
              </div>
            </div>
          </SectionCard>
        ) : null}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("space-y-4 border border-border/70 p-5 shadow-sm", className)}>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </Card>
  );
}

function TextSetting({
  title,
  description,
  value,
  busy,
  onSave,
  multiline = false,
}: {
  title: string;
  description: string;
  value: string;
  busy: boolean;
  onSave: (value: string) => void;
  multiline?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <div className="space-y-2 rounded-xl border border-border/60 p-4">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {multiline ? (
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          aria-label={title}
        />
      ) : (
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label={title}
        />
      )}
      <Button
        type="button"
        size="sm"
        disabled={busy || draft === value}
        onClick={() => onSave(draft)}
      >
        {busy ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

function SelectSetting({
  title,
  description,
  value,
  options,
  busy,
  onSave,
}: {
  title: string;
  description: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  busy: boolean;
  onSave: (value: string) => void;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border/60 p-4">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Select value={value} onValueChange={onSave} disabled={busy}>
        <SelectTrigger aria-label={title} className="w-full">
          <SelectValue placeholder="Choose an option" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {busy ? <p className="text-xs text-muted-foreground">Saving…</p> : null}
    </div>
  );
}

function PolicyCheckbox({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(next) => onChange(next === true)}
        aria-label={label}
      />
      <span>{label}</span>
    </label>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return fallback;
}

function readPasswordPolicy(value: unknown): PasswordPolicy {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    minLength: asNumber(record.minLength, 12),
    requireUppercase: Boolean(record.requireUppercase ?? true),
    requireLowercase: Boolean(record.requireLowercase ?? true),
    requireNumber: Boolean(record.requireNumber ?? true),
    requireSymbol: Boolean(record.requireSymbol ?? true),
  };
}

function readOtpLength(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && Number.isFinite(Number(value))) return Number(value);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if (typeof record.max === "number") return record.max;
    if (typeof record.min === "number") return record.min;
  }
  return 6;
}

function readNestedString(value: unknown, key: string, fallback: string): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const nested = (value as Record<string, unknown>)[key];
    if (typeof nested === "string") return nested;
  }
  return fallback;
}

function parseFromDisplay(value: string): { name: string; email: string } {
  const match = value.match(/^(.*?)\s*<([^>]+)>$/);
  if (match?.[1] && match[2]) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  if (value.includes("@")) {
    return { name: "Unique Sky Way", email: value.trim() };
  }
  return { name: value.trim() || "Unique Sky Way", email: "info@uniqueskyway.com" };
}

function withCurrentOption(
  options: Array<{ value: string; label: string }>,
  current: string,
): Array<{ value: string; label: string }> {
  if (options.some((option) => option.value === current)) return options;
  return [...options, { value: current, label: current }];
}

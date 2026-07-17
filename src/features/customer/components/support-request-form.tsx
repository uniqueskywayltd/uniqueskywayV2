"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

import { Button, Input, Label, Textarea } from "@/components/ui";
import { submitContactIntake } from "@/features/public/actions/contact-intake";
import { useI18n } from "@/features/i18n/i18n-provider";

export function SupportRequestForm({
  defaultEmail = "",
  defaultName = "",
}: {
  defaultEmail?: string;
  defaultName?: string;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [topic, setTopic] = useState(t("support.topic_default"));
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await submitContactIntake({
      name,
      email,
      topic,
      message,
      companyWebsite: "",
    });

    setPending(false);
    if (!result.ok) {
      setError(
        result.error === "rate_limited" ? t("support.rate_limited") : t("support.form_error"),
      );
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <section className="rounded-xl border border-border/80 p-6">
        <h2 className="text-base font-semibold text-foreground">{t("support.received_title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("support.received_body")}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/account/notifications">{t("notifications.title")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/account/help">{t("support.back_help")}</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mx-auto max-w-lg space-y-4">
      <p className="text-sm text-muted-foreground">{t("support.intro")}</p>
      <div className="space-y-2">
        <Label htmlFor="support-name">{t("support.name")}</Label>
        <Input id="support-name" value={name} onChange={(event) => setName(event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="support-email">{t("support.email")}</Label>
        <Input
          id="support-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="support-topic">{t("support.topic")}</Label>
        <Input
          id="support-topic"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="support-message">{t("support.message")}</Label>
        <Textarea
          id="support-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={6}
        />
      </div>
      <input
        type="text"
        name="companyWebsite"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? t("support.sending") : t("support.submit")}
        </Button>
        <Button asChild type="button" variant="ghost">
          <Link href="/account/help">{t("ui.cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}

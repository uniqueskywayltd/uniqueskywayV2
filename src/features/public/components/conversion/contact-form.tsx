"use client";

import { useState, useTransition, type FormEvent } from "react";

import {
  isMathCaptchaCorrect,
  MathCaptchaField,
  randomMathDigit,
} from "@/features/auth/components/math-captcha-field";
import { submitContactIntake } from "@/features/public/actions/contact-intake";
import { getContactTopics } from "@/features/public/content/i18n-public-content";
import { useI18n } from "@/features/i18n/i18n-provider";
import { Button } from "@/components/ui";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ContactForm() {
  const { t } = useI18n();
  const topics = getContactTopics(t);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [captchaA] = useState(() => randomMathDigit());
  const [captchaB] = useState(() => randomMathDigit());
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    if (!isMathCaptchaCorrect(captchaA, captchaB, captchaAnswer)) {
      setStatus("error");
      setErrorHint(t("contact.form.captcha_error"));
      return;
    }

    startTransition(async () => {
      const result = await submitContactIntake({
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        topic: String(data.get("topic") ?? ""),
        message: String(data.get("message") ?? ""),
        companyWebsite: String(data.get("companyWebsite") ?? ""),
      });

      if (result.ok) {
        setStatus("success");
        setErrorHint(null);
        setCaptchaAnswer("");
        form.reset();
        return;
      }

      setStatus("error");
      if (result.error === "rate_limited") {
        setErrorHint(t("contact.form.rate_limited"));
      } else {
        setErrorHint(t("contact.form.error_body"));
      }
    });
  }

  if (status === "success") {
    return (
      <div
        className="rounded-xl border border-border/80 bg-background p-6"
        role="status"
        aria-live="polite"
      >
        <p className="text-base font-semibold text-foreground">{t("contact.form.success_title")}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t("contact.form.success_body")}
        </p>
        <Button type="button" variant="outline" className="mt-6" onClick={() => setStatus("idle")}>
          {t("contact.form.send_another")}
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative space-y-5 rounded-xl border border-border/80 bg-card p-6 text-foreground shadow-sm"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">{t("contact.form.name")}</Label>
          <Input id="contact-name" name="name" required autoComplete="name" maxLength={120} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">{t("contact.form.email")}</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={254}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-topic">{t("contact.form.topic")}</Label>
        <select
          id="contact-topic"
          name="topic"
          required
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          defaultValue=""
        >
          <option value="" disabled>
            {t("contact.form.select_topic")}
          </option>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.label}>
              {topic.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">{t("contact.form.message")}</Label>
        <Textarea id="contact-message" name="message" required maxLength={4000} rows={6} />
      </div>

      <MathCaptchaField
        a={captchaA}
        b={captchaB}
        value={captchaAnswer}
        onChange={setCaptchaAnswer}
        disabled={pending}
      />

      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="companyWebsite">{t("contact.form.honeypot")}</label>
        <input id="companyWebsite" name="companyWebsite" tabIndex={-1} autoComplete="off" />
      </div>

      {status === "error" && errorHint ? (
        <p className="text-sm text-destructive" role="alert">
          {errorHint}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? t("contact.form.sending") : t("contact.form.submit")}
      </Button>
    </form>
  );
}

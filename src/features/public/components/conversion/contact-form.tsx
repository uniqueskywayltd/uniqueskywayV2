"use client";

import { useState, useTransition, type FormEvent } from "react";

import {
  isMathCaptchaCorrect,
  MathCaptchaField,
  randomMathDigit,
} from "@/features/auth/components/math-captcha-field";
import { submitContactIntake } from "@/features/public/actions/contact-intake";
import { CONTACT_COPY } from "@/features/public/content/conversion-pages";
import { Button } from "@/components/ui";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ContactForm() {
  const copy = CONTACT_COPY.form;
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
      setErrorHint("Check the sum and try again.");
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
        setErrorHint("Please wait a moment before sending another message.");
      } else if (result.error === "honeypot") {
        setErrorHint(copy.errorBody);
      } else {
        setErrorHint(copy.errorBody);
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
        <p className="text-base font-semibold text-foreground">{copy.successTitle}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.successBody}</p>
        <Button type="button" variant="outline" className="mt-6" onClick={() => setStatus("idle")}>
          Send another message
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
          <Label htmlFor="contact-name">{copy.nameLabel}</Label>
          <Input id="contact-name" name="name" required autoComplete="name" maxLength={120} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">{copy.emailLabel}</Label>
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
        <Label htmlFor="contact-topic">{copy.topicLabel}</Label>
        <select
          id="contact-topic"
          name="topic"
          required
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          defaultValue=""
        >
          <option value="" disabled>
            Select a topic
          </option>
          {copy.topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">{copy.messageLabel}</Label>
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
        <label htmlFor="companyWebsite">{copy.honeypotLabel}</label>
        <input id="companyWebsite" name="companyWebsite" tabIndex={-1} autoComplete="off" />
      </div>

      {status === "error" && errorHint ? (
        <p className="text-sm text-destructive" role="alert">
          {errorHint}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : copy.submitLabel}
      </Button>
    </form>
  );
}

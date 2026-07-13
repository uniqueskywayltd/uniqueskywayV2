"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

import { Button, Input, Label, Textarea } from "@/components/ui";
import { submitContactIntake } from "@/features/public/actions/contact-intake";

export function SupportRequestForm({
  defaultEmail = "",
  defaultName = "",
}: {
  defaultEmail?: string;
  defaultName?: string;
}) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [topic, setTopic] = useState("Account support");
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
        result.error === "rate_limited"
          ? "Please wait a minute before sending another request."
          : "Check the form fields and try again.",
      );
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <section className="rounded-xl border border-border/80 p-6">
        <h2 className="text-base font-semibold text-foreground">Request received</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We logged your support request. Response timing is expectancy — not a clock promise. Check
          notifications for account updates in the meantime.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/account/notifications">Notifications</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/account/help">Back to Help</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="mx-auto max-w-lg space-y-4">
      <p className="text-sm text-muted-foreground">
        Structured support intake uses the same frozen contact path as public Contact — no invented
        ticket engine.
      </p>
      <div className="space-y-2">
        <Label htmlFor="support-name">Name</Label>
        <Input id="support-name" value={name} onChange={(event) => setName(event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="support-email">Email</Label>
        <Input
          id="support-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="support-topic">Topic</Label>
        <Input id="support-topic" value={topic} onChange={(event) => setTopic(event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="support-message">Message</Label>
        <Textarea
          id="support-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={6}
        />
      </div>
      {/* honeypot */}
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
          {pending ? "Sending…" : "Submit request"}
        </Button>
        <Button asChild type="button" variant="ghost">
          <Link href="/account/help">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}

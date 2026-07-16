"use server";

import { z } from "zod";

import { PLATFORM_SUPPORT_EMAIL, resolveResendFromAddress } from "@/config/email-identity";
import { getServerEnv } from "@/config/server-env";
import { ResendEmailSender } from "@/infrastructure/email";
import { logger } from "@/infrastructure/logging/logger";

const contactIntakeSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  topic: z.string().trim().min(2).max(80),
  message: z.string().trim().min(10).max(4000),
  companyWebsite: z.string().max(0).optional(),
});

export type ContactIntakeResult =
  | { ok: true }
  | { ok: false; error: "validation" | "rate_limited" | "honeypot" | "delivery_failed" };

const recentByKey = new Map<string, number>();
const RATE_LIMIT_MS = 60_000;

function pruneRateLimit(now: number) {
  for (const [key, timestamp] of recentByKey) {
    if (now - timestamp > RATE_LIMIT_MS) {
      recentByKey.delete(key);
    }
  }
}

/**
 * Contact intake — validates and delivers to the official support inbox.
 */
export async function submitContactIntake(input: {
  name: string;
  email: string;
  topic: string;
  message: string;
  companyWebsite?: string;
}): Promise<ContactIntakeResult> {
  if (input.companyWebsite && input.companyWebsite.length > 0) {
    return { ok: false, error: "honeypot" };
  }

  const parsed = contactIntakeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "validation" };
  }

  const now = Date.now();
  pruneRateLimit(now);
  const rateKey = parsed.data.email.toLowerCase();
  const last = recentByKey.get(rateKey);
  if (last && now - last < RATE_LIMIT_MS) {
    return { ok: false, error: "rate_limited" };
  }
  recentByKey.set(rateKey, now);

  const supportEmail = process.env.CONTACT_SUPPORT_EMAIL?.trim() || PLATFORM_SUPPORT_EMAIL;

  try {
    const env = getServerEnv();
    const sender = ResendEmailSender.fromApiKey(env.RESEND_API_KEY);
    await sender.send({
      from: resolveResendFromAddress(env.RESEND_FROM_EMAIL),
      to: supportEmail,
      subject: `Contact: ${parsed.data.topic}`,
      html: `<p><strong>From:</strong> ${escapeHtml(parsed.data.name)} &lt;${escapeHtml(parsed.data.email)}&gt;</p><p><strong>Topic:</strong> ${escapeHtml(parsed.data.topic)}</p><p>${escapeHtml(parsed.data.message)}</p>`,
      text: `From: ${parsed.data.name} <${parsed.data.email}>\nTopic: ${parsed.data.topic}\n\n${parsed.data.message}`,
      idempotencyKey: `contact:${rateKey}:${now}`,
      headers: {
        "Reply-To": parsed.data.email,
      },
      tags: [
        { name: "category", value: "contact" },
        { name: "template", value: "public_contact_intake" },
      ],
    });
  } catch (error) {
    logger.error(
      {
        event: "public.contact.delivery_failed",
        cause: error instanceof Error ? error.message : "Unknown error",
        topic: parsed.data.topic,
      },
      "Contact intake email delivery failed",
    );
    return { ok: false, error: "delivery_failed" };
  }

  logger.info(
    {
      event: "public.contact.intake",
      topic: parsed.data.topic,
      emailDomain: parsed.data.email.split("@")[1] ?? "unknown",
      messageLength: parsed.data.message.length,
      deliveryConfigured: true,
      supportEmail,
    },
    "Public contact intake delivered",
  );

  return { ok: true };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

"use server";

import { z } from "zod";

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
  | { ok: false; error: "validation" | "rate_limited" | "honeypot" };

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
 * Wave A contact intake — validates and accepts messages without inventing
 * undeliverable public channels. Delivery to a staff inbox activates when
 * CONTACT_SUPPORT_EMAIL is configured; until then the form still works as
 * structured intake with server-side logging.
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

  logger.info(
    {
      event: "public.contact.intake",
      topic: parsed.data.topic,
      emailDomain: parsed.data.email.split("@")[1] ?? "unknown",
      messageLength: parsed.data.message.length,
      deliveryConfigured: Boolean(process.env.CONTACT_SUPPORT_EMAIL),
    },
    "Public contact intake accepted",
  );

  return { ok: true };
}

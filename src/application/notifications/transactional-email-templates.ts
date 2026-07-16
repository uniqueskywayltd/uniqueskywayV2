import "server-only";

import { APP_METADATA } from "@/config/constants";

import { AUTH_EMAIL_TEMPLATES } from "@/application/auth/constants";
import { renderIdentityEmail } from "@/application/auth/identity-email-templates";

export interface RenderTransactionalEmailInput {
  templateKey: string;
  metadata: Record<string, unknown>;
}

export interface RenderedTransactionalEmail {
  subject: string;
  html: string;
  text: string;
}

const IDENTITY_TEMPLATE_KEYS = new Set<string>(Object.values(AUTH_EMAIL_TEMPLATES));

export function renderTransactionalEmail(
  input: RenderTransactionalEmailInput,
): RenderedTransactionalEmail {
  if (IDENTITY_TEMPLATE_KEYS.has(input.templateKey)) {
    return renderIdentityEmail({
      templateKey:
        input.templateKey as (typeof AUTH_EMAIL_TEMPLATES)[keyof typeof AUTH_EMAIL_TEMPLATES],
      metadata: input.metadata,
    });
  }

  switch (input.templateKey) {
    case "deposit.initiated":
      return simple(
        "Deposit created",
        "Your deposit request was created and is awaiting confirmation.",
      );
    case "deposit.confirmed":
      return simple(
        "Deposit approved",
        "Your deposit was approved and credited to your available balance.",
      );
    case "deposit.failed":
      return simple("Deposit rejected", "Your deposit could not be completed.");
    case "deposit.cancelled":
      return simple("Deposit cancelled", "Your deposit was cancelled.");
    case "deposit.reversed":
      return simple("Deposit reversed", "A previously confirmed deposit was reversed.");
    case "withdrawal.requested":
      return simple("Withdrawal requested", "Your withdrawal request is under review.");
    case "withdrawal.approved":
      return simple("Withdrawal approved", "Your withdrawal request has been approved.");
    case "withdrawal.rejected":
      return simple("Withdrawal rejected", "Your withdrawal request was rejected.");
    case "withdrawal.paid":
      return simple("Withdrawal paid", "Your withdrawal has been paid out.");
    case "withdrawal.failed":
      return simple("Withdrawal failed", "Your withdrawal payout failed.");
    case "withdrawal.cancelled":
      return simple("Withdrawal cancelled", "Your withdrawal request was cancelled.");
    case "investment.activated":
      return simple("Investment activated", "Your investment has been activated.");
    case "investment.roi_credited":
      return simple("Daily ROI credited", "Daily ROI has been credited to your available balance.");
    case "investment.completed":
      return simple(
        "Investment completed",
        "Your investment term completed and principal was released.",
      );
    case "referral.reward":
      return simple("Referral reward", "A referral reward was credited to your account.");
    case "profile.email_changed":
      return simple("Profile email changed", "Your account email address was updated.");
    default:
      return simple(
        "Unique Sky Way notification",
        `You have a new account notification (${input.templateKey}).`,
      );
  }
}

function simple(subject: string, body: string): RenderedTransactionalEmail {
  return {
    subject,
    html: `
      <main>
        <p>${escapeHtml(APP_METADATA.displayName)}</p>
        <h1>${escapeHtml(subject)}</h1>
        <p>${escapeHtml(body)}</p>
      </main>
    `,
    text: `${APP_METADATA.displayName}\n\n${subject}\n\n${body}`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

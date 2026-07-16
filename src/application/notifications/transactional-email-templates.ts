import "server-only";

import { renderIdentityEmail } from "@/application/auth/identity-email-templates";
import { AUTH_EMAIL_TEMPLATES } from "@/application/auth/constants";
import { getEmailBrand } from "@/config/public-app-url";

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
      return branded(
        "Deposit created",
        "Your deposit request was created and is awaiting confirmation.",
      );
    case "deposit.confirmed":
      return branded(
        "Deposit approved",
        "Your deposit was approved and credited to your available balance.",
      );
    case "deposit.failed":
      return branded("Deposit rejected", "Your deposit could not be completed.");
    case "deposit.cancelled":
      return branded("Deposit cancelled", "Your deposit was cancelled.");
    case "deposit.reversed":
      return branded("Deposit reversed", "A previously confirmed deposit was reversed.");
    case "withdrawal.requested":
      return branded("Withdrawal requested", "Your withdrawal request is under review.");
    case "withdrawal.approved":
      return branded("Withdrawal approved", "Your withdrawal request has been approved.");
    case "withdrawal.rejected":
      return branded("Withdrawal rejected", "Your withdrawal request was rejected.");
    case "withdrawal.paid":
      return branded("Withdrawal paid", "Your withdrawal has been paid out.");
    case "withdrawal.failed":
      return branded("Withdrawal failed", "Your withdrawal payout failed.");
    case "withdrawal.cancelled":
      return branded("Withdrawal cancelled", "Your withdrawal request was cancelled.");
    case "investment.activated":
      return branded("Investment activated", "Your investment has been activated.");
    case "investment.roi_credited":
      return branded(
        "Daily ROI credited",
        "Daily ROI has been credited to your available balance.",
      );
    case "investment.completed":
      return branded(
        "Investment completed",
        "Your investment term completed and principal was released.",
      );
    case "referral.reward":
      return branded("Referral reward", "A referral reward was credited to your account.");
    case "profile.email_changed":
      return branded("Profile email changed", "Your account email address was updated.");
    default:
      return branded(
        "Unique Sky Way notification",
        `You have a new account notification (${input.templateKey}).`,
      );
  }
}

function branded(subject: string, body: string): RenderedTransactionalEmail {
  const brand = getEmailBrand();
  const year = new Date().getFullYear();
  return {
    subject,
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#e8eef5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:24px;text-align:center;background:#0b3b66;">
          <img src="${escapeAttr(brand.logoUrl)}" width="160" alt="${escapeHtml(brand.name)}" style="display:block;margin:0 auto;max-width:160px;" />
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 12px;font-size:22px;">${escapeHtml(subject)}</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(body)}</p>
          <p style="margin:24px 0 0;text-align:center;">
            <a href="${escapeAttr(brand.appUrl)}" style="display:inline-block;background:#0b3b66;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;">Open Unique Sky Way</a>
          </p>
        </td></tr>
        <tr><td style="padding:20px 28px;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#64748b;">
          Support: <a href="mailto:${escapeAttr(brand.supportEmail)}" style="color:#0b3b66;">${escapeHtml(brand.supportEmail)}</a><br/>
          © ${year} ${escapeHtml(brand.name)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    text: `${brand.name}\n\n${subject}\n\n${body}\n\nSupport: ${brand.supportEmail}\n${brand.appUrl}`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

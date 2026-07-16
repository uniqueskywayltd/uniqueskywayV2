import "server-only";

import { displayOtp } from "@/application/auth/otp";
import { getEmailBrand } from "@/config/public-app-url";

import { AUTH_EMAIL_TEMPLATES } from "./constants";
import type { IdentityEmailTemplate } from "./identity-email-queue";

export interface RenderIdentityEmailInput {
  templateKey: IdentityEmailTemplate;
  metadata: Record<string, unknown>;
}

export interface RenderedIdentityEmail {
  subject: string;
  html: string;
  text: string;
}

export function renderIdentityEmail(input: RenderIdentityEmailInput): RenderedIdentityEmail {
  const brand = getEmailBrand();

  switch (input.templateKey) {
    case AUTH_EMAIL_TEMPLATES.verifyEmail:
      return renderBranded({
        brand,
        subject: "Verify your Unique Sky Way email",
        preview: "Your Unique Sky Way verification code",
        title: "Verify your email",
        body: "Use the verification code below to complete your account setup.",
        code: displayOtp(readString(input.metadata.otp)),
        actionLink: readString(input.metadata.actionLink),
        actionLabel: "Verify email",
      });
    case AUTH_EMAIL_TEMPLATES.emailVerified:
      return renderBranded({
        brand,
        subject: "Your email is verified",
        preview: "Your Unique Sky Way email is verified",
        title: "Email verified",
        body: "Your Unique Sky Way account email has been verified. You can sign in and continue.",
        actionLink: brand.loginUrl,
        actionLabel: "Sign in",
      });
    case AUTH_EMAIL_TEMPLATES.welcome: {
      const temporaryPassword = readString(input.metadata.temporaryPassword);
      const loginUrl = readString(input.metadata.loginUrl) ?? brand.loginUrl;
      const mustChangePassword = Boolean(input.metadata.mustChangePassword);
      const adminCreated = Boolean(input.metadata.adminCreated);
      const lines = [
        "Your Unique Sky Way account is ready.",
        adminCreated
          ? "An administrator created this account for you."
          : "You can sign in and continue setting up your profile.",
      ];
      if (temporaryPassword) {
        lines.push(`Temporary password: ${temporaryPassword}`);
      }
      if (mustChangePassword) {
        lines.push("Please change your password immediately after your first sign-in.");
      }
      return renderBranded({
        brand,
        subject: "Welcome to Unique Sky Way",
        preview: "Welcome to Unique Sky Way",
        title: "Welcome",
        body: lines.join(" "),
        actionLink: loginUrl,
        actionLabel: "Sign in",
      });
    }
    case AUTH_EMAIL_TEMPLATES.passwordReset:
      return renderBranded({
        brand,
        subject: "Reset your Unique Sky Way password",
        preview: "Password reset code",
        title: "Password reset",
        body: "Use the code below to reset your password. If you did not request this, contact support.",
        code: displayOtp(readString(input.metadata.otp)),
        actionLink: readString(input.metadata.actionLink),
        actionLabel: "Reset password",
      });
    case AUTH_EMAIL_TEMPLATES.passwordChanged:
      return renderBranded({
        brand,
        subject: "Your password was changed",
        preview: "Password changed",
        title: "Password changed",
        body: "Your Unique Sky Way password was changed. Contact support immediately if this was not you.",
        actionLink: brand.loginUrl,
        actionLabel: "Sign in",
      });
    case AUTH_EMAIL_TEMPLATES.newDeviceSignIn: {
      const browser = readString(input.metadata.browser) ?? "Unknown browser";
      const os = readString(input.metadata.os) ?? "Unknown OS";
      const signedInAt = readString(input.metadata.signedInAt) ?? new Date().toISOString();
      const ipMasked = readString(input.metadata.ipAddressMasked) ?? "unavailable";
      const location = readString(input.metadata.approximateLocation);
      const locationLine = location
        ? `Approximate location: ${location}`
        : "Approximate location: unavailable";
      return renderBranded({
        brand,
        subject: "New sign in detected",
        preview: "New sign-in on your Unique Sky Way account",
        title: "New sign in detected",
        body: [
          `A new sign-in was recorded for your Unique Sky Way account.`,
          `Time: ${signedInAt}`,
          `Browser: ${browser}`,
          `OS: ${os}`,
          `IP: ${ipMasked}`,
          locationLine,
          `If this was not you, change your password and revoke trusted devices immediately.`,
        ].join(" "),
        actionLink: `${brand.appUrl}/account/security`,
        actionLabel: "Review security",
      });
    }
    case AUTH_EMAIL_TEMPLATES.accountLocked:
      return renderBranded({
        brand,
        subject: "Account temporarily locked",
        preview: "Account locked",
        title: "Account locked",
        body: "Your account was temporarily locked after repeated failed sign-in attempts.",
        actionLink: brand.loginUrl,
        actionLabel: "Sign in later",
      });
    case AUTH_EMAIL_TEMPLATES.accountUnlocked:
      return renderBranded({
        brand,
        subject: "Account unlocked",
        preview: "Account unlocked",
        title: "Account unlocked",
        body: "Your account lockout window has ended. You can sign in again.",
        actionLink: brand.loginUrl,
        actionLabel: "Sign in",
      });
    default:
      return exhaustive(input.templateKey);
  }
}

function renderBranded(input: {
  brand: ReturnType<typeof getEmailBrand>;
  subject: string;
  preview: string;
  title: string;
  body: string;
  code?: string | null;
  actionLink?: string | null;
  actionLabel?: string;
}): RenderedIdentityEmail {
  const year = new Date().getFullYear();
  const codeBlock = input.code
    ? `<div style="margin:24px 0;padding:16px 20px;background:#f4f7fb;border-radius:12px;text-align:center;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Verification code</p>
        <p style="margin:0;font-size:32px;letter-spacing:0.2em;font-weight:700;color:#0f172a;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${escapeHtml(input.code)}</p>
      </div>`
    : "";
  const cta =
    input.actionLink && input.actionLabel
      ? `<p style="margin:28px 0 0;text-align:center;">
          <a href="${escapeAttribute(input.actionLink)}" style="display:inline-block;background:#0b3b66;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;">${escapeHtml(input.actionLabel)}</a>
        </p>
        <p style="margin:12px 0 0;font-size:12px;color:#64748b;word-break:break-all;">Or open: ${escapeHtml(input.actionLink)}</p>`
      : "";
  const textCode = input.code ? `\n\nCode: ${input.code}` : "";
  const textLink = input.actionLink
    ? `\n\n${input.actionLabel ?? "Link"}: ${input.actionLink}`
    : "";

  return {
    subject: input.subject,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#e8eef5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preview)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e8eef5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,0.08);">
          <tr>
            <td style="padding:28px 28px 12px;text-align:center;background:linear-gradient(180deg,#0b3b66 0%,#0f4c81 100%);">
              <img src="${escapeAttribute(input.brand.logoUrl)}" width="180" alt="${escapeHtml(input.brand.name)}" style="display:block;margin:0 auto;max-width:180px;height:auto;" />
              <p style="margin:12px 0 0;color:#dbeafe;font-size:13px;">${escapeHtml(input.brand.tagline)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0f172a;">${escapeHtml(input.title)}</h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(input.body)}</p>
              ${codeBlock}
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#0f172a;font-weight:600;">${escapeHtml(input.brand.name)}</p>
              <p style="margin:0 0 6px;font-size:12px;color:#64748b;">
                Support: <a href="mailto:${escapeAttribute(input.brand.supportEmail)}" style="color:#0b3b66;text-decoration:none;">${escapeHtml(input.brand.supportEmail)}</a>
              </p>
              <p style="margin:0;font-size:11px;color:#94a3b8;">© ${year} ${escapeHtml(input.brand.name)}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    text: `${input.brand.name}\n\n${input.title}\n\n${input.body}${textCode}${textLink}\n\nSupport: ${input.brand.supportEmail}\n${input.brand.appUrl}`,
  };
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function exhaustive(value: never): never {
  throw new Error(`Unhandled identity email template: ${String(value)}`);
}

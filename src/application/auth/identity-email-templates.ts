import "server-only";

import { APP_METADATA } from "@/config/constants";

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
  switch (input.templateKey) {
    case AUTH_EMAIL_TEMPLATES.verifyEmail:
      return renderTemplate({
        subject: "Verify your Unique Sky Way email",
        title: "Verify your email",
        body: "Use the verification code below to complete your account setup.",
        code: readString(input.metadata.otp),
        actionLink: readString(input.metadata.actionLink),
      });
    case AUTH_EMAIL_TEMPLATES.emailVerified:
      return renderTemplate({
        subject: "Your email is verified",
        title: "Email verified",
        body: "Your Unique Sky Way account email has been verified.",
      });
    case AUTH_EMAIL_TEMPLATES.welcome: {
      const temporaryPassword = readString(input.metadata.temporaryPassword);
      const loginUrl = readString(input.metadata.loginUrl);
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
      if (loginUrl) {
        lines.push(`Sign in: ${loginUrl}`);
      }
      return renderTemplate({
        subject: "Welcome to Unique Sky Way",
        title: "Welcome",
        body: lines.join(" "),
        actionLink: loginUrl,
      });
    }
    case AUTH_EMAIL_TEMPLATES.passwordReset:
      return renderTemplate({
        subject: "Reset your Unique Sky Way password",
        title: "Password reset",
        body: "Use the code below to reset your password.",
        code: readString(input.metadata.otp),
        actionLink: readString(input.metadata.actionLink),
      });
    case AUTH_EMAIL_TEMPLATES.passwordChanged:
      return renderTemplate({
        subject: "Your password was changed",
        title: "Password changed",
        body: "Your Unique Sky Way password was changed. Contact support if this was not you.",
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
      return renderTemplate({
        subject: "New sign in detected",
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
      });
    }
    case AUTH_EMAIL_TEMPLATES.accountLocked:
      return renderTemplate({
        subject: "Account temporarily locked",
        title: "Account locked",
        body: "Your account was temporarily locked after repeated failed sign-in attempts.",
      });
    case AUTH_EMAIL_TEMPLATES.accountUnlocked:
      return renderTemplate({
        subject: "Account unlocked",
        title: "Account unlocked",
        body: "Your account lockout window has ended.",
      });
    default:
      return exhaustive(input.templateKey);
  }
}

function renderTemplate(input: {
  subject: string;
  title: string;
  body: string;
  code?: string | null;
  actionLink?: string | null;
}): RenderedIdentityEmail {
  const codeBlock = input.code
    ? `<p style="font-size: 28px; letter-spacing: 6px; font-weight: 700;">${escapeHtml(input.code)}</p>`
    : "";
  const linkBlock = input.actionLink
    ? `<p><a href="${escapeAttribute(input.actionLink)}">Open secure link</a></p>`
    : "";
  const textCode = input.code ? `\n\nCode: ${input.code}` : "";
  const textLink = input.actionLink ? `\n\nSecure link: ${input.actionLink}` : "";

  return {
    subject: input.subject,
    html: `
      <main>
        <p>${APP_METADATA.displayName}</p>
        <h1>${escapeHtml(input.title)}</h1>
        <p>${escapeHtml(input.body)}</p>
        ${codeBlock}
        ${linkBlock}
      </main>
    `,
    text: `${APP_METADATA.displayName}\n\n${input.title}\n\n${input.body}${textCode}${textLink}`,
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

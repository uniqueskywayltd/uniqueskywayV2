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
    case AUTH_EMAIL_TEMPLATES.welcome:
      return renderTemplate({
        subject: "Welcome to Unique Sky Way",
        title: "Welcome",
        body: "Your identity foundation is ready. You can continue setting up your account when the next platform phase is available.",
      });
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
    case AUTH_EMAIL_TEMPLATES.newDeviceSignIn:
      return renderTemplate({
        subject: "New device sign-in",
        title: "New device sign-in",
        body: `A sign-in was recorded from ${readString(input.metadata.deviceLabel) ?? "a new device"}.`,
      });
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

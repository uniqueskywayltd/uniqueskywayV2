import "server-only";

import { render } from "@react-email/components";
import type { ReactElement } from "react";

import { displayOtp } from "@/application/auth/otp";
import { AUTH_EMAIL_TEMPLATES } from "@/application/auth/constants";
import { getBrand } from "@/emails/brand";
import {
  AccountReactivatedEmail,
  AccountSuspendedEmail,
  BroadcastAnnouncementEmail,
  DailyRoiEmail,
  DepositApprovedEmail,
  DepositRejectedEmail,
  DepositSubmittedEmail,
  InvestmentActivatedEmail,
  InvestmentMaturedEmail,
  ReferralCommissionEmail,
  ReinvestmentCompletedEmail,
  WithdrawalApprovedEmail,
  WithdrawalCancelledEmail,
  WithdrawalCompletedEmail,
  WithdrawalRejectedEmail,
  WithdrawalSubmittedEmail,
  financialPlainText,
} from "@/emails/financial";
import LoginAlertEmail from "@/emails/login-alert";
import NewDeviceLoginEmail from "@/emails/new-device-login";
import PasswordChangedEmail from "@/emails/password-changed";
import PasswordResetEmail from "@/emails/password-reset";
import RegistrationWelcomeEmail from "@/emails/registration-welcome";
import VerifyEmail from "@/emails/verify-email";
import { formatMoneyMinorUnits } from "@/i18n/format";

export interface RenderProductionEmailInput {
  templateKey: string;
  metadata: Record<string, unknown>;
}

export interface RenderedProductionEmail {
  subject: string;
  html: string;
  text: string;
  previewId: string;
}

/**
 * Canonical production email renderer.
 * Maps every transactional template key to the V1 production React Email templates
 * (same design as email-previews/*.html).
 */
export async function renderProductionEmail(
  input: RenderProductionEmailInput,
): Promise<RenderedProductionEmail> {
  const built = buildEmail(input.templateKey, input.metadata);
  const html = await render(built.element);
  return {
    subject: built.subject,
    html,
    text: built.text,
    previewId: built.previewId,
  };
}

function buildEmail(
  templateKey: string,
  metadata: Record<string, unknown>,
): { subject: string; text: string; previewId: string; element: ReactElement } {
  const brand = getBrand();
  const name = recipientName(metadata);
  const dashboardUrl = readString(metadata.dashboardUrl) ?? `${brand.url}/dashboard`;
  const amount = formatAmount(metadata);
  const referenceId = referenceFrom(metadata);
  const status = readString(metadata.status);
  const reason = readString(metadata.reason) ?? readString(metadata.failureReason);
  const base = buildBase({
    name,
    dashboardUrl,
    amount,
    referenceId,
    paymentMethod: readString(metadata.paymentMethod) ?? readString(metadata.destinationType),
    requestDate: readString(metadata.requestDate),
    status,
  });

  switch (templateKey) {
    case AUTH_EMAIL_TEMPLATES.verifyEmail: {
      const otp = displayOtp(readString(metadata.otp));
      const verifyUrl = readString(metadata.actionLink) ?? `${brand.url}/auth/verify-email`;
      return {
        previewId: "verify-email",
        subject: `Verify your ${brand.name} email`,
        text: [
          `Hi ${name},`,
          "",
          "Verify your email to finish setting up your account.",
          otp ? `Verification code: ${otp}` : null,
          `Verify: ${verifyUrl}`,
          "",
          `Support: ${brand.email}`,
        ]
          .filter(Boolean)
          .join("\n"),
        element: VerifyEmail({ name, verifyUrl, otp }),
      };
    }
    case AUTH_EMAIL_TEMPLATES.welcome: {
      const firstName = readString(metadata.firstName) ?? name.split(" ")[0] ?? "Investor";
      const username =
        readString(metadata.username) ??
        readString(metadata.displayName) ??
        firstName.toLowerCase().replace(/\s+/g, "");
      const temporaryPassword = readString(metadata.temporaryPassword);
      const loginUrl = readString(metadata.loginUrl) ?? `${brand.url}/auth/login`;
      const emailVerified =
        Boolean(metadata.adminCreated) || Boolean(metadata.emailVerified) || !temporaryPassword;
      return {
        previewId: "welcome",
        subject: `Welcome to ${brand.name}`,
        text: [
          `Hi ${firstName},`,
          "",
          `Welcome to ${brand.name}. Your investor account is ready.`,
          temporaryPassword ? `Temporary password: ${temporaryPassword}` : null,
          `Sign in: ${loginUrl}`,
          "",
          `Support: ${brand.email}`,
        ]
          .filter(Boolean)
          .join("\n"),
        element: RegistrationWelcomeEmail({
          firstName,
          username,
          emailVerified,
          temporaryPassword,
          mustChangePassword: Boolean(metadata.mustChangePassword),
          loginUrl,
        }),
      };
    }
    case AUTH_EMAIL_TEMPLATES.emailVerified: {
      return {
        previewId: "welcome",
        subject: "Your email is verified",
        text: `Hi ${name},\n\nYour email is verified. You can sign in at ${brand.url}/auth/login\n\nSupport: ${brand.email}`,
        element: RegistrationWelcomeEmail({
          firstName: name.split(" ")[0] ?? name,
          username: readString(metadata.username) ?? "investor",
          emailVerified: true,
          loginUrl: `${brand.url}/auth/login`,
        }),
      };
    }
    case AUTH_EMAIL_TEMPLATES.passwordReset: {
      const otp = displayOtp(readString(metadata.otp));
      const resetUrl = readString(metadata.actionLink) ?? `${brand.url}/auth/reset-password`;
      return {
        previewId: "password-reset",
        subject: `Reset your ${brand.name} password`,
        text: [
          `Hi ${name},`,
          "",
          "We received a request to reset your password.",
          otp ? `Reset code: ${otp}` : null,
          `Reset: ${resetUrl}`,
          "",
          `Support: ${brand.email}`,
        ]
          .filter(Boolean)
          .join("\n"),
        element: PasswordResetEmail({ name, resetUrl, otp }),
      };
    }
    case AUTH_EMAIL_TEMPLATES.passwordChanged: {
      const changedAt =
        readString(metadata.changedAt) ??
        new Date().toLocaleString("en-US", {
          timeZone: "UTC",
          dateStyle: "long",
          timeStyle: "short",
        }) + " UTC";
      return {
        previewId: "password-changed",
        subject: "Your password was changed",
        text: `Hi ${name},\n\nYour password was changed on ${changedAt}.\n\nSupport: ${brand.email}`,
        element: PasswordChangedEmail({
          name,
          changedAt,
          securityUrl: `${brand.url}/account/security`,
        }),
      };
    }
    case AUTH_EMAIL_TEMPLATES.newDeviceSignIn: {
      const browser = readString(metadata.browser) ?? "Unknown browser";
      const os = readString(metadata.os) ?? "Unknown OS";
      const device =
        readString(metadata.device) ?? readString(metadata.deviceLabel) ?? `${browser} on ${os}`;
      const ipAddress =
        readString(metadata.ipAddress) ?? readString(metadata.ipAddressMasked) ?? "unavailable";
      const loginTime =
        readString(metadata.signedInAt) ??
        readString(metadata.loginTime) ??
        new Date().toISOString();
      const approximateLocation = readString(metadata.approximateLocation);
      const sessionsUrl = `${brand.url}/account/security/sessions`;
      const isTrustedDeviceAlert = Boolean(metadata.trustedDevice);
      if (isTrustedDeviceAlert) {
        return {
          previewId: "login-alert",
          subject: "New sign-in detected",
          text: `Hi ${name},\n\nNew sign-in on ${loginTime}.\nDevice: ${device}\nIP: ${ipAddress}\n\nSupport: ${brand.email}`,
          element: LoginAlertEmail({
            name,
            device,
            ipAddress,
            loginTime,
            securityUrl: `${brand.url}/account/security`,
          }),
        };
      }
      return {
        previewId: "new-device-login",
        subject: "New device sign-in",
        text: `Hi ${name},\n\nNew device sign-in.\nDevice: ${device}\nBrowser: ${browser}\nOS: ${os}\nIP: ${ipAddress}\nTime: ${loginTime}\n\nSessions: ${sessionsUrl}\nSupport: ${brand.email}`,
        element: NewDeviceLoginEmail({
          name,
          ipAddress,
          browser,
          os,
          device,
          approximateLocation,
          loginTime,
          sessionsUrl,
        }),
      };
    }
    case AUTH_EMAIL_TEMPLATES.accountLocked: {
      return {
        previewId: "login-alert",
        subject: "Account temporarily locked",
        text: financialPlainText.accountSuspended({
          name,
          reason: "Repeated failed sign-in attempts",
        }),
        element: AccountSuspendedEmail({
          name,
          reason: "Repeated failed sign-in attempts",
          dashboardUrl: `${brand.url}/auth/login`,
        }),
      };
    }
    case AUTH_EMAIL_TEMPLATES.accountUnlocked: {
      return {
        previewId: "welcome",
        subject: "Account unlocked",
        text: `Hi ${name},\n\nYour account lockout has ended. You can sign in again.\n\nSupport: ${brand.email}`,
        element: AccountReactivatedEmail({
          name,
          dashboardUrl: `${brand.url}/auth/login`,
        }),
      };
    }
    case "deposit.initiated":
      return {
        previewId: "deposit-submitted",
        subject: "Deposit submitted",
        text: financialPlainText.depositSubmitted({ ...base, status: status ?? "Pending review" }),
        element: DepositSubmittedEmail({ ...base, status: status ?? "Pending review" }),
      };
    case "deposit.confirmed":
      return {
        previewId: "deposit-approved",
        subject: "Deposit approved",
        text: financialPlainText.depositApproved({ ...base, status: status ?? "Approved" }),
        element: DepositApprovedEmail({ ...base, status: status ?? "Approved" }),
      };
    case "deposit.failed":
    case "deposit.cancelled":
    case "deposit.reversed":
      return {
        previewId: "deposit-rejected",
        subject: "Deposit not approved",
        text: financialPlainText.depositRejected(withOptional(base, { reason })),
        element: DepositRejectedEmail(withOptional(base, { reason })),
      };
    case "withdrawal.requested":
      return {
        previewId: "withdrawal-submitted",
        subject: "Withdrawal submitted",
        text: financialPlainText.withdrawalSubmitted(
          withOptional(base, {
            method: base.paymentMethod,
            processingEstimate: "Up to 24 hours.",
          }),
        ),
        element: WithdrawalSubmittedEmail(
          withOptional(base, {
            method: base.paymentMethod,
            processingEstimate: "Up to 24 hours.",
          }),
        ),
      };
    case "withdrawal.approved":
      return {
        previewId: "withdrawal-approved",
        subject: "Withdrawal approved",
        text: financialPlainText.withdrawalApproved(
          withOptional(base, { status: status ?? "Approved" }),
        ),
        element: WithdrawalApprovedEmail(withOptional(base, { status: status ?? "Approved" })),
      };
    case "withdrawal.rejected":
    case "withdrawal.failed":
      return {
        previewId: "withdrawal-rejected",
        subject: "Withdrawal not approved",
        text: financialPlainText.withdrawalRejected(withOptional(base, { reason })),
        element: WithdrawalRejectedEmail(withOptional(base, { reason })),
      };
    case "withdrawal.paid":
      return {
        previewId: "withdrawal-completed",
        subject: "Withdrawal paid",
        text: financialPlainText.withdrawalCompleted(
          withOptional(base, { status: status ?? "Paid" }),
        ),
        element: WithdrawalCompletedEmail(withOptional(base, { status: status ?? "Paid" })),
      };
    case "withdrawal.cancelled":
      return {
        previewId: "withdrawal-rejected",
        subject: "Withdrawal cancelled",
        text: financialPlainText.withdrawalCancelled(withOptional(base, { status: "Cancelled" })),
        element: WithdrawalCancelledEmail(withOptional(base, { status: "Cancelled" })),
      };
    case "investment.activated":
      return {
        previewId: "investment-activated",
        subject: "Investment activated",
        text: financialPlainText.investmentActivated(
          withOptional(base, { planName: readString(metadata.planName) }),
        ),
        element: InvestmentActivatedEmail(
          withOptional(base, { planName: readString(metadata.planName) }),
        ),
      };
    case "investment.roi_credited": {
      const roiAmount =
        formatAmount({
          amountMinor: metadata.postedRoiMinor ?? metadata.amountMinor,
          currency: metadata.currency,
        }) ??
        amount ??
        "+$0.00";
      const signed =
        roiAmount.startsWith("+") || roiAmount.startsWith("-") ? roiAmount : `+${roiAmount}`;
      return {
        previewId: "daily-roi",
        subject: `Daily ROI credited — ${signed}`,
        text: financialPlainText.dailyRoi(
          withOptional(base, { amount: signed, roiAmount: signed }),
        ),
        element: DailyRoiEmail(withOptional(base, { amount: signed, roiAmount: signed })),
      };
    }
    case "investment.completed": {
      const reinvested = Boolean(metadata.reinvested);
      if (reinvested) {
        return {
          previewId: "reinvestment-completed",
          subject: "Reinvestment completed",
          text: financialPlainText.reinvestmentCompleted(
            withOptional(base, { planName: readString(metadata.planName) }),
          ),
          element: ReinvestmentCompletedEmail(
            withOptional(base, { planName: readString(metadata.planName) }),
          ),
        };
      }
      return {
        previewId: "investment-matured",
        subject: "Investment matured",
        text: financialPlainText.investmentMatured(
          withOptional(base, { planName: readString(metadata.planName) }),
        ),
        element: InvestmentMaturedEmail(
          withOptional(base, { planName: readString(metadata.planName) }),
        ),
      };
    }
    case "referral.reward":
      return {
        previewId: "referral-commission",
        subject: "Referral commission earned",
        text: financialPlainText.referralCommission(
          withOptional(base, {
            commissionAmount: amount,
            referralName: readString(metadata.referralName),
            referralBalance: readString(metadata.referralBalance),
            totalReferralEarnings: readString(metadata.totalReferralEarnings),
          }),
        ),
        element: ReferralCommissionEmail(
          withOptional(base, {
            commissionAmount: amount,
            referralName: readString(metadata.referralName),
            referralBalance: readString(metadata.referralBalance),
            totalReferralEarnings: readString(metadata.totalReferralEarnings),
          }),
        ),
      };
    case "admin.broadcast":
    case "platform.broadcast": {
      const title = readString(metadata.title) ?? "Platform announcement";
      const body =
        readString(metadata.body) ??
        readString(metadata.message) ??
        "Please open your dashboard for the latest update.";
      return {
        previewId: "broadcast",
        subject: title,
        text: financialPlainText.broadcast({ name, title, body }),
        element: BroadcastAnnouncementEmail({ name, title, body }),
      };
    }
    default: {
      const title = readString(metadata.title) ?? "Unique Sky Way notification";
      const body =
        readString(metadata.body) ?? `You have a new account notification (${templateKey}).`;
      return {
        previewId: "broadcast",
        subject: title,
        text: `${title}\n\nHi ${name},\n\n${body}\n\nSupport: ${brand.email}`,
        element: BroadcastAnnouncementEmail({ name, title, body }),
      };
    }
  }
}

function recipientName(metadata: Record<string, unknown>): string {
  return (
    readString(metadata.name) ??
    readString(metadata.displayName) ??
    readString(metadata.legalName) ??
    readString(metadata.firstName) ??
    "Investor"
  );
}

function formatAmount(metadata: Record<string, unknown>): string | null {
  const formatted = readString(metadata.amount) ?? readString(metadata.amountFormatted);
  if (formatted) return formatted;
  const minor = metadata.amountMinor ?? metadata.postedRoiMinor;
  if (typeof minor === "string" || typeof minor === "number" || typeof minor === "bigint") {
    const value = Number(minor);
    if (Number.isFinite(value)) {
      const currency = readString(metadata.currency) ?? "USD";
      return formatMoneyMinorUnits("en", value, currency);
    }
  }
  return null;
}

function referenceFrom(metadata: Record<string, unknown>): string | null {
  return (
    readString(metadata.referenceId) ??
    readString(metadata.providerIntentId) ??
    readString(metadata.providerPayoutReference) ??
    readString(metadata.depositIntentId) ??
    readString(metadata.withdrawalId) ??
    readString(metadata.investmentId) ??
    null
  );
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

type EmailBaseProps = {
  name: string;
  dashboardUrl: string;
  amount?: string;
  referenceId?: string;
  paymentMethod?: string;
  requestDate?: string;
  status?: string;
};

function buildBase(input: {
  name: string;
  dashboardUrl: string;
  amount: string | null;
  referenceId: string | null;
  paymentMethod: string | null;
  requestDate: string | null;
  status: string | null;
}): EmailBaseProps {
  const base: EmailBaseProps = {
    name: input.name,
    dashboardUrl: input.dashboardUrl,
  };
  if (input.amount) base.amount = input.amount;
  if (input.referenceId) base.referenceId = input.referenceId;
  if (input.paymentMethod) base.paymentMethod = input.paymentMethod;
  if (input.requestDate) base.requestDate = input.requestDate;
  if (input.status) base.status = input.status;
  return base;
}

function withOptional<
  T extends EmailBaseProps,
  E extends Record<string, string | null | undefined>,
>(base: T, extra: E): T & { [K in keyof E]?: string } {
  const out: Record<string, string> = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    if (value) out[key] = value;
  }
  return out as T & { [K in keyof E]?: string };
}

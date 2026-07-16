import "server-only";

import { render } from "@react-email/components";
import type { ReactElement } from "react";

import { displayOtp } from "@/application/auth/otp";
import { AUTH_EMAIL_TEMPLATES } from "@/application/auth/constants";
import { getBrand } from "@/emails/brand";
import { formatEmailDateTime } from "@/emails/format-datetime";
import {
  AccountReactivatedEmail,
  AccountSuspendedEmail,
  BroadcastAnnouncementEmail,
  DailyRoiEmail,
  DepositApprovedEmail,
  DepositRejectedEmail,
  DepositSubmittedEmail,
  AdminDepositSubmittedEmail,
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
import NewDeviceLoginEmail from "@/emails/new-device-login";
import PasswordChangedEmail from "@/emails/password-changed";
import PasswordResetEmail from "@/emails/password-reset";
import RegistrationWelcomeEmail from "@/emails/registration-welcome";
import VerifyEmail from "@/emails/verify-email";
import WelcomeEmail from "@/emails/welcome";
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
      if (!otp) {
        throw new Error("auth.verify_email requires an OTP in metadata");
      }
      return {
        previewId: "verify-email",
        subject: `Your ${brand.name} verification code`,
        text: [
          `Hi ${name},`,
          "",
          "Enter the verification code below in the signup window, or open the link to verify your email and complete your account setup.",
          `Verification code: ${otp}`,
          `Verify: ${verifyUrl}`,
          "",
          "This verification code and link expire in 24 hours.",
          "",
          `Reply to this email if you need help or have questions.`,
        ].join("\n"),
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
      const isAdminOrProvisioned = Boolean(metadata.adminCreated) || Boolean(temporaryPassword);

      if (isAdminOrProvisioned) {
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
            `Reply to this email if you need help or have questions.`,
          ]
            .filter(Boolean)
            .join("\n"),
          element: RegistrationWelcomeEmail({
            firstName,
            username,
            ...(readString(metadata.email) ? { email: readString(metadata.email)! } : {}),
            emailVerified,
            temporaryPassword,
            mustChangePassword: Boolean(metadata.mustChangePassword),
            loginUrl,
          }),
        };
      }

      return {
        previewId: "welcome",
        subject: `Welcome to ${brand.name}`,
        text: [
          `Welcome, ${name}`,
          "",
          `Thank you for opening an investor account with ${brand.name}. We're glad to have you on board.`,
          "",
          "Please verify your email address to activate your account and access your secure investor dashboard — portfolio overview, deposits, withdrawals, and full transaction history.",
          "",
          "If you didn't create this account, you can safely ignore this email.",
          "",
          `Reply to this email if you need help or have questions.`,
        ].join("\n"),
        element: WelcomeEmail({ name }),
      };
    }
    case AUTH_EMAIL_TEMPLATES.emailVerified: {
      return {
        previewId: "welcome",
        subject: "Your email is verified",
        text: `Hi ${name},\n\nYour email is verified. You can sign in at ${brand.url}/auth/login\n\nReply to this email if you need help or have questions.`,
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
          "We received a request to reset your password. Enter the code in the reset window, or open the link to choose a new password.",
          otp ? `Reset code: ${otp}` : null,
          `Choose new password: ${resetUrl}`,
          "",
          "If you didn't request this, ignore this email. Your password will remain unchanged.",
          "",
          `Reply to this email if you need help or have questions.`,
        ]
          .filter(Boolean)
          .join("\n"),
        element: PasswordResetEmail({ name, resetUrl, otp }),
      };
    }
    case AUTH_EMAIL_TEMPLATES.passwordChanged: {
      const changedAtRaw = readString(metadata.changedAt) ?? new Date().toISOString();
      const changedAt = formatEmailDateTime(changedAtRaw);
      return {
        previewId: "password-changed",
        subject: "Your password was changed",
        text: `Hi ${name},\n\nYour password was changed on ${changedAt}.\n\nReply to this email if you need help or have questions.`,
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
      const loginTimeRaw =
        readString(metadata.signedInAt) ??
        readString(metadata.loginTime) ??
        new Date().toISOString();
      const loginTime = formatEmailDateTime(loginTimeRaw);
      const approximateLocation = readString(metadata.approximateLocation);
      const sessionsUrl = `${brand.url}/account/security/sessions`;
      return {
        previewId: "new-device-login",
        subject: "New device sign-in",
        text: [
          `Hi ${name},`,
          "",
          "We noticed a sign-in from a device we don't recognize.",
          `Device: ${device}`,
          `Browser: ${browser}`,
          `OS: ${os}`,
          `IP: ${ipAddress}`,
          approximateLocation ? `Location: ${approximateLocation}` : null,
          `Date / time: ${loginTime}`,
          "",
          "If this wasn't you, change your password immediately and review active sessions.",
          `Review sessions: ${sessionsUrl}`,
          "Reply to this email if you need help or have questions.",
        ]
          .filter(Boolean)
          .join("\n"),
        element: NewDeviceLoginEmail({
          name,
          ipAddress,
          browser,
          os,
          device,
          approximateLocation,
          loginTime: loginTimeRaw,
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
        text: `Hi ${name},\n\nYour account lockout has ended. You can sign in again.\n\nReply to this email if you need help or have questions.`,
        element: AccountReactivatedEmail({
          name,
          dashboardUrl: `${brand.url}/auth/login`,
        }),
      };
    }
    case "deposit.initiated":
      return {
        previewId: "deposit-submitted",
        subject: "Deposit submitted successfully",
        text: financialPlainText.depositSubmitted({
          ...base,
          status: status ?? "Awaiting Review",
        }),
        element: DepositSubmittedEmail({ ...base, status: status ?? "Awaiting Review" }),
      };
    case "admin.deposit_submitted":
      return {
        previewId: "deposit-submitted",
        subject: `New deposit awaiting review — ${referenceId ?? "deposit"}`,
        text: [
          "New deposit submitted",
          "",
          `Customer: ${name}`,
          readString(metadata.customerEmail)
            ? `Email: ${readString(metadata.customerEmail)}`
            : null,
          amount ? `Amount: ${amount}` : null,
          readString(metadata.fundingNetwork) || readString(metadata.paymentMethod)
            ? `Network/Method: ${readString(metadata.fundingNetwork) ?? readString(metadata.paymentMethod)}`
            : null,
          referenceId ? `Reference: ${referenceId}` : null,
          readString(metadata.requestDate)
            ? `Submitted: ${readString(metadata.requestDate)}`
            : null,
          "",
          `Review: ${readString(metadata.adminDashboardUrl) ?? dashboardUrl}`,
        ]
          .filter(Boolean)
          .join("\n"),
        element: AdminDepositSubmittedEmail({
          ...base,
          name: "Finance Team",
          status: status ?? "Awaiting Review",
          ...(readString(metadata.customerEmail)
            ? { customerEmail: readString(metadata.customerEmail)! }
            : {}),
          ...(readString(metadata.fundingNetwork)
            ? { network: readString(metadata.fundingNetwork)! }
            : {}),
          ...(readString(metadata.adminDashboardUrl)
            ? { adminDashboardUrl: readString(metadata.adminDashboardUrl)! }
            : {}),
        }),
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
    case "investment.activated": {
      const planName = readString(metadata.planName) ?? "Investment plan";
      const schedule = readSchedule(metadata.schedule);
      const activatedProps = {
        ...withOptional(base, {
          planName,
          principal: readString(metadata.principal) ?? amount ?? undefined,
          dailyRate: readString(metadata.dailyRate) ?? undefined,
          dailyEarnings: readString(metadata.dailyEarnings) ?? undefined,
          duration: readString(metadata.duration) ?? undefined,
          startDateTime: readString(metadata.startDateTime) ?? undefined,
          maturityDateTime: readString(metadata.maturityDateTime) ?? undefined,
          expectedProfit: readString(metadata.expectedProfit) ?? undefined,
          maturityValue: readString(metadata.maturityValue) ?? undefined,
          nextSettlement: readString(metadata.nextSettlement) ?? undefined,
          investmentUrl:
            readString(metadata.investmentUrl) ??
            (referenceId ? `${brand.url}/portfolio/${referenceId}` : dashboardUrl),
          currentYear: readString(metadata.currentYear) ?? String(new Date().getFullYear()),
          referenceId: referenceId ?? undefined,
          dashboardUrl,
        }),
        ...(schedule ? { schedule } : {}),
      };
      return {
        previewId: "investment-activated",
        subject: `🎉 Your Investment is Now Active — ${planName}`,
        text: financialPlainText.investmentActivated(activatedProps),
        element: InvestmentActivatedEmail(activatedProps),
      };
    }
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
        text: `${title}\n\nHi ${name},\n\n${body}\n\nReply to this email if you need help or have questions.`,
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

function readSchedule(value: unknown): Array<{ label: string; amount: string }> | undefined {
  if (!Array.isArray(value)) return undefined;
  const rows: Array<{ label: string; amount: string }> = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const label = readString((item as { label?: unknown }).label);
    const amount = readString((item as { amount?: unknown }).amount) ?? "";
    if (!label) continue;
    rows.push({ label, amount });
  }
  return rows.length > 0 ? rows : undefined;
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

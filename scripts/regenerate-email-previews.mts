/**
 * Regenerates email-previews/*.html from React Email PreviewProps.
 * Run: npx tsx scripts/regenerate-email-previews.mts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { render } from "@react-email/components";
import { createElement, type ComponentType } from "react";

import {
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
  WithdrawalCompletedEmail,
  WithdrawalRejectedEmail,
  WithdrawalSubmittedEmail,
} from "../src/emails/financial.tsx";
import NewDeviceLoginEmail from "../src/emails/new-device-login.tsx";
import PasswordChangedEmail from "../src/emails/password-changed.tsx";
import PasswordResetEmail from "../src/emails/password-reset.tsx";
import RegistrationWelcomeEmail from "../src/emails/registration-welcome.tsx";
import VerifyEmail from "../src/emails/verify-email.tsx";
import WelcomeEmail from "../src/emails/welcome.tsx";

type PreviewComponent = ComponentType<Record<string, unknown>> & {
  PreviewProps?: Record<string, unknown>;
};

const templates: Array<{ id: string; Component: PreviewComponent }> = [
  { id: "verify-email", Component: VerifyEmail as PreviewComponent },
  { id: "welcome", Component: WelcomeEmail as PreviewComponent },
  {
    id: "registration-welcome",
    Component: RegistrationWelcomeEmail as PreviewComponent,
  },
  { id: "password-reset", Component: PasswordResetEmail as PreviewComponent },
  { id: "password-changed", Component: PasswordChangedEmail as PreviewComponent },
  { id: "new-device-login", Component: NewDeviceLoginEmail as PreviewComponent },
  { id: "login-alert", Component: NewDeviceLoginEmail as PreviewComponent },
  { id: "deposit-submitted", Component: DepositSubmittedEmail as PreviewComponent },
  { id: "deposit-approved", Component: DepositApprovedEmail as PreviewComponent },
  { id: "deposit-rejected", Component: DepositRejectedEmail as PreviewComponent },
  { id: "withdrawal-submitted", Component: WithdrawalSubmittedEmail as PreviewComponent },
  { id: "withdrawal-approved", Component: WithdrawalApprovedEmail as PreviewComponent },
  { id: "withdrawal-completed", Component: WithdrawalCompletedEmail as PreviewComponent },
  { id: "withdrawal-rejected", Component: WithdrawalRejectedEmail as PreviewComponent },
  { id: "investment-activated", Component: InvestmentActivatedEmail as PreviewComponent },
  { id: "daily-roi", Component: DailyRoiEmail as PreviewComponent },
  { id: "investment-matured", Component: InvestmentMaturedEmail as PreviewComponent },
  { id: "reinvestment-completed", Component: ReinvestmentCompletedEmail as PreviewComponent },
  { id: "referral-commission", Component: ReferralCommissionEmail as PreviewComponent },
  { id: "broadcast", Component: BroadcastAnnouncementEmail as PreviewComponent },
];

async function main() {
  const outDir = path.resolve("email-previews");
  await mkdir(outDir, { recursive: true });

  for (const { id, Component } of templates) {
    const props = Component.PreviewProps ?? {};
    const html = await render(createElement(Component, props));
    if (
      html.includes("Need help? Contact") ||
      html.includes("Questions? Contact our investor support team")
    ) {
      throw new Error(`${id} still contains legacy contact copy`);
    }
    await writeFile(path.join(outDir, `${id}.html`), html, "utf8");
    console.log(`wrote ${id}.html`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { getBrand } from "@/emails/brand";
import {
  TransactionalEmail,
  plainTransactionalEmail,
  type DetailLine,
} from "./components/transactional-email";

type BaseProps = {
  name: string;
  amount?: string;
  referenceId?: string;
  dashboardUrl?: string;
  paymentMethod?: string;
  requestDate?: string;
  status?: string;
};

const defaultDashboard = () => `${getBrand().url}/dashboard`;

const sampleBase: BaseProps = {
  name: "Alex Morgan",
  amount: "$5,000.00",
  referenceId: "DEP-2026-00482",
  dashboardUrl: "https://uniqueskyway.com/dashboard",
  paymentMethod: "Bitcoin (BTC)",
  requestDate: "07/10/2026",
  status: "Pending review",
};

function details(props: BaseProps, extra: DetailLine[] = []): DetailLine[] {
  const base: DetailLine[] = [];
  if (props.amount) base.push({ label: "Amount", value: props.amount, highlight: true });
  if (props.referenceId) base.push({ label: "Reference", value: props.referenceId });
  if (props.paymentMethod) base.push({ label: "Payment method", value: props.paymentMethod });
  if (props.requestDate) base.push({ label: "Date", value: props.requestDate });
  if (props.status) base.push({ label: "Status", value: props.status });
  return [...base, ...extra];
}

export function DepositSubmittedEmail(props: BaseProps) {
  return (
    <TransactionalEmail
      preview="Your deposit has been submitted for review"
      heading="Deposit submitted"
      badge={{ label: "Pending review", tone: "warning" }}
      name={props.name}
      intro="We received your deposit request and our finance team is reviewing it. You will be notified once a decision is made."
      details={details(props)}
      cta={{ label: "View deposit", href: props.dashboardUrl ?? defaultDashboard() }}
    />
  );
}

DepositSubmittedEmail.PreviewProps = sampleBase;

export function DepositApprovedEmail(props: BaseProps) {
  return (
    <TransactionalEmail
      preview="Your deposit has been approved"
      heading="Deposit approved"
      badge={{ label: "Approved", tone: "success" }}
      name={props.name}
      intro="Your deposit has been approved. Funds are being applied to your investment."
      details={details({ ...props, status: props.status ?? "Approved" })}
      cta={{ label: "View portfolio", href: props.dashboardUrl ?? defaultDashboard() }}
    />
  );
}

DepositApprovedEmail.PreviewProps = { ...sampleBase, status: "Approved" };

export function DepositCreditedEmail(props: BaseProps) {
  return (
    <TransactionalEmail
      preview="Your deposit has been credited"
      heading="Deposit credited"
      badge={{ label: "Credited", tone: "success" }}
      name={props.name}
      intro="Your deposit has been credited and your investment is now active."
      details={details({ ...props, status: props.status ?? "Credited" })}
      cta={{ label: "View portfolio", href: props.dashboardUrl ?? defaultDashboard() }}
    />
  );
}

DepositCreditedEmail.PreviewProps = { ...sampleBase, status: "Credited" };

export function DepositRejectedEmail(props: BaseProps & { reason?: string }) {
  return (
    <TransactionalEmail
      preview="Your deposit could not be approved"
      heading="Deposit not approved"
      badge={{ label: "Not approved", tone: "danger" }}
      name={props.name}
      intro="Unfortunately we were unable to approve your deposit at this time."
      details={details(props, props.reason ? [{ label: "Reason", value: props.reason }] : [])}
      footerNote="If you believe this is an error, please contact support with your reference ID."
      cta={{ label: "Contact support", href: `mailto:info@uniqueskyway.com` }}
    />
  );
}

DepositRejectedEmail.PreviewProps = {
  ...sampleBase,
  reason: "Payment proof could not be verified. Please resubmit with a clear screenshot.",
};

export function WithdrawalSubmittedEmail(
  props: BaseProps & {
    username?: string;
    charges?: string;
    netAmount?: string;
    method?: string;
    requestDate?: string;
    processingEstimate?: string;
  },
) {
  const greetingName = props.username ?? props.name;
  const summary: DetailLine[] = [];
  if (props.amount) summary.push({ label: "Amount", value: props.amount });
  if (props.charges) summary.push({ label: "Charges", value: props.charges });
  if (props.netAmount ?? props.amount) {
    summary.push({
      label: "Net amount",
      value: props.netAmount ?? props.amount ?? "—",
      highlight: true,
    });
  }
  if (props.method) summary.push({ label: "Method", value: props.method });
  if (props.referenceId) summary.push({ label: "Reference", value: props.referenceId });
  if (props.requestDate) summary.push({ label: "Request date", value: props.requestDate });

  return (
    <TransactionalEmail
      preview="Your withdrawal request has been received successfully"
      heading="Withdrawal Request Submitted"
      badge={{ label: "Pending review", tone: "warning" }}
      name={greetingName}
      intro="Your withdrawal request has been received successfully. Our treasury team is reviewing it and will process your payout according to your selected method."
      details={summary}
      detailsTitle="Withdrawal Summary"
      processingEstimate={props.processingEstimate ?? "Up to 24 hours."}
      securityWarning="If you did not request this withdrawal, please contact support immediately."
      cta={{ label: "View Dashboard", href: props.dashboardUrl ?? defaultDashboard() }}
    />
  );
}

WithdrawalSubmittedEmail.PreviewProps = {
  ...sampleBase,
  username: "Alex",
  name: "Alex Morgan",
  amount: "$1,250.00",
  charges: "$0.00",
  netAmount: "$1,250.00",
  method: "Bitcoin (BTC)",
  referenceId: "WDR-2026-00193",
  requestDate: "07/10/2026",
  processingEstimate: "Up to 24 hours.",
};

export function WithdrawalApprovedEmail(props: BaseProps & { processingEstimate?: string }) {
  return (
    <TransactionalEmail
      preview="Your withdrawal has been approved"
      heading="Withdrawal approved"
      badge={{ label: "Approved", tone: "success" }}
      name={props.name}
      intro="Your withdrawal request has been approved and is being processed."
      details={details({ ...props, status: props.status ?? "Approved" })}
      processingEstimate={props.processingEstimate ?? "Up to 24 hours."}
      cta={{ label: "View wallet", href: props.dashboardUrl ?? defaultDashboard() }}
    />
  );
}

WithdrawalApprovedEmail.PreviewProps = {
  ...sampleBase,
  amount: "$1,250.00",
  referenceId: "WDR-2026-00193",
  status: "Approved",
};

export function WithdrawalCompletedEmail(props: BaseProps) {
  return (
    <TransactionalEmail
      preview="Your withdrawal has been paid"
      heading="Withdrawal paid"
      badge={{ label: "Paid", tone: "success" }}
      name={props.name}
      intro="Your withdrawal has been paid successfully."
      details={details({ ...props, status: props.status ?? "Paid" })}
      cta={{ label: "View wallet", href: props.dashboardUrl ?? defaultDashboard() }}
    />
  );
}

WithdrawalCompletedEmail.PreviewProps = {
  ...sampleBase,
  amount: "$1,250.00",
  referenceId: "WDR-2026-00193",
};

export function WithdrawalRejectedEmail(props: BaseProps & { reason?: string }) {
  return (
    <TransactionalEmail
      preview="Your withdrawal could not be processed"
      heading="Withdrawal not approved"
      badge={{ label: "Not approved", tone: "danger" }}
      name={props.name}
      intro="We were unable to approve your withdrawal request."
      details={details(props, props.reason ? [{ label: "Reason", value: props.reason }] : [])}
      footerNote="Your available balance has not been affected. Contact support if you need assistance."
      cta={{ label: "Contact support", href: `mailto:info@uniqueskyway.com` }}
    />
  );
}

WithdrawalRejectedEmail.PreviewProps = {
  ...sampleBase,
  amount: "$1,250.00",
  referenceId: "WDR-2026-00193",
  reason: "Withdrawal details did not match the account on file.",
};

export function InvestmentActivatedEmail(props: BaseProps & { planName?: string }) {
  return (
    <TransactionalEmail
      preview="Your investment is now active"
      heading="Investment activated"
      badge={{ label: "Active", tone: "success" }}
      name={props.name}
      intro="Your investment has been activated and is now earning returns according to your plan terms."
      details={details(props, props.planName ? [{ label: "Plan", value: props.planName }] : [])}
      cta={{ label: "View investment", href: props.dashboardUrl ?? defaultDashboard() }}
    />
  );
}

InvestmentActivatedEmail.PreviewProps = {
  ...sampleBase,
  planName: "Growth Portfolio — 12 months",
};

export function DailyRoiEmail(props: BaseProps & { roiAmount?: string }) {
  const credited = props.roiAmount || props.amount || "+$0.00";

  return (
    <TransactionalEmail
      preview={`Your daily ROI has been credited — ${credited}`}
      heading="Daily ROI Successfully Credited"
      badge={{ label: "ROI credited", tone: "success" }}
      name={props.name}
      intro="Great news! Your investment has generated today's return, and it has been successfully credited to your Unique Sky Way investment account."
      introSecondary="Your money is working for you—another day, another step toward growing your wealth."
      detailsTitle="Today's Earnings"
      details={[
        { label: "💰 Daily ROI Credited", value: credited, highlight: true },
        { label: "💵 Amount Added to Your Account", value: credited, highlight: true },
        { label: "📈 Investment Status", value: "Active & Earning" },
      ]}
      bodyNote="Your updated balance and transaction history are now available in your dashboard. Thank you for investing with Unique Sky Way. We're committed to helping your investments grow securely, consistently, and transparently."
      supportLead="If you have any questions, our Investor Success Team is always available at"
      closingTagline="Invest Smart. Grow Daily. Build Wealth."
      cta={{ label: "View Portfolio", href: props.dashboardUrl ?? defaultDashboard() }}
    />
  );
}

DailyRoiEmail.PreviewProps = {
  ...sampleBase,
  name: "Karol Kempa",
  amount: "+$546.00",
  roiAmount: "+$546.00",
};

export function InvestmentMaturedEmail(props: BaseProps & { planName?: string }) {
  return (
    <TransactionalEmail
      preview="Your investment cycle has completed"
      heading="Investment cycle completed"
      badge={{ label: "Completed", tone: "neutral" }}
      name={props.name}
      intro="Your investment has reached maturity and this cycle is complete. Principal has been returned to your available balance. You may reinvest or withdraw from your dashboard."
      details={details(props, props.planName ? [{ label: "Plan", value: props.planName }] : [])}
      cta={{ label: "Manage portfolio", href: props.dashboardUrl ?? defaultDashboard() }}
    />
  );
}

InvestmentMaturedEmail.PreviewProps = {
  ...sampleBase,
  planName: "Growth Portfolio — 12 months",
};

export function ReinvestmentCompletedEmail(props: BaseProps & { planName?: string }) {
  return (
    <TransactionalEmail
      preview="Your investment cycle completed — reinvestment is active"
      heading="Investment cycle completed"
      badge={{ label: "Reinvested", tone: "success" }}
      name={props.name}
      intro="Your previous investment cycle completed and your reinvestment position is now active."
      details={details(props, props.planName ? [{ label: "Plan", value: props.planName }] : [])}
      cta={{ label: "View portfolio", href: props.dashboardUrl ?? defaultDashboard() }}
    />
  );
}

ReinvestmentCompletedEmail.PreviewProps = {
  ...sampleBase,
  planName: "Growth Portfolio — 12 months",
};

export function ReferralCommissionEmail(
  props: BaseProps & {
    commissionAmount?: string;
    referralName?: string;
    referralBalance?: string;
    totalReferralEarnings?: string;
  },
) {
  const extra: DetailLine[] = [];
  if (props.referralName) extra.push({ label: "Referral", value: props.referralName });
  if (props.commissionAmount) {
    extra.push({ label: "Commission earned", value: props.commissionAmount, highlight: true });
  }
  if (props.referralBalance)
    extra.push({ label: "Referral balance", value: props.referralBalance });
  if (props.totalReferralEarnings) {
    extra.push({ label: "Total referral earnings", value: props.totalReferralEarnings });
  }

  return (
    <TransactionalEmail
      preview="You earned a referral commission"
      heading="Referral commission earned"
      badge={{ label: "Commission", tone: "success" }}
      name={props.name}
      intro="A referral commission has been credited to your account."
      details={details(props, extra)}
      cta={{ label: "View referrals", href: `${defaultDashboard()}/referrals` }}
    />
  );
}

ReferralCommissionEmail.PreviewProps = {
  ...sampleBase,
  commissionAmount: "$50.00",
  referralName: "Jordan Lee",
  referralBalance: "$150.00",
  totalReferralEarnings: "$450.00",
  referenceId: "REF-2026-00821",
};

export function WithdrawalCancelledEmail(props: BaseProps) {
  return (
    <TransactionalEmail
      preview="Your withdrawal request was cancelled"
      heading="Withdrawal cancelled"
      badge={{ label: "Cancelled", tone: "neutral" }}
      name={props.name}
      intro="Your withdrawal request has been cancelled. The reserved funds have been returned to your available balance if they were held."
      details={details(props, [{ label: "Status", value: props.status ?? "Cancelled" }])}
      cta={{ label: "View wallet", href: props.dashboardUrl ?? defaultDashboard() }}
    />
  );
}

WithdrawalCancelledEmail.PreviewProps = {
  ...sampleBase,
  status: "Cancelled",
};

export function ReferralRegisteredEmail(
  props: BaseProps & { referralName?: string; referralUsername?: string },
) {
  return (
    <TransactionalEmail
      preview="A new investor joined with your referral link"
      heading="New referral registered"
      badge={{ label: "Referral", tone: "success" }}
      name={props.name}
      intro="Someone just created an account using your referral link. You will earn a commission when they activate an investment."
      details={details(props, [
        ...(props.referralName ? [{ label: "New member", value: props.referralName }] : []),
        ...(props.referralUsername
          ? [{ label: "Username", value: `@${props.referralUsername}` }]
          : []),
      ])}
      cta={{ label: "View referrals", href: props.dashboardUrl ?? defaultDashboard() }}
    />
  );
}

ReferralRegisteredEmail.PreviewProps = {
  ...sampleBase,
  referralName: "Jordan Lee",
  referralUsername: "jordanlee",
};

export function AccountSuspendedEmail(props: BaseProps & { reason?: string }) {
  return (
    <TransactionalEmail
      preview="Your account has been suspended"
      heading="Account suspended"
      badge={{ label: "Suspended", tone: "danger" }}
      name={props.name}
      intro="Your investor account has been suspended by an administrator. You will not be able to sign in until the account is reactivated."
      details={details(props, props.reason ? [{ label: "Reason", value: props.reason }] : [])}
      cta={{ label: "Contact support", href: "mailto:info@uniqueskyway.com" }}
    />
  );
}

AccountSuspendedEmail.PreviewProps = {
  ...sampleBase,
  reason: "Security review",
};

export function AccountReactivatedEmail(props: BaseProps) {
  return (
    <TransactionalEmail
      preview="Your account has been reactivated"
      heading="Account reactivated"
      badge={{ label: "Active", tone: "success" }}
      name={props.name}
      intro="Your investor account has been reactivated. You can sign in and continue using your dashboard."
      details={details(props, [{ label: "Status", value: "Active" }])}
      cta={{ label: "Sign in", href: props.dashboardUrl ?? defaultDashboard() }}
    />
  );
}

AccountReactivatedEmail.PreviewProps = sampleBase;

export function BroadcastAnnouncementEmail(props: { name: string; title: string; body: string }) {
  return (
    <TransactionalEmail
      preview={props.title}
      heading={props.title}
      badge={{ label: "Announcement", tone: "neutral" }}
      name={props.name}
      intro={props.body}
      cta={{ label: "Open dashboard", href: defaultDashboard() }}
    />
  );
}

BroadcastAnnouncementEmail.PreviewProps = {
  name: "Alex Morgan",
  title: "Scheduled maintenance — July 8",
  body: "We will perform scheduled platform maintenance on July 8 from 2:00–4:00 AM UTC. Your funds remain secure and all balances are unaffected. The investor dashboard may be briefly unavailable during this window.",
};

export const financialPlainText = {
  depositSubmitted: (p: BaseProps) =>
    plainTransactionalEmail({
      heading: "Deposit submitted",
      name: p.name,
      intro: "We received your deposit request and our team is reviewing it.",
      details: details(p),
    }),
  depositApproved: (p: BaseProps) =>
    plainTransactionalEmail({
      heading: "Deposit approved",
      name: p.name,
      intro: "Your deposit has been approved.",
      details: details({ ...p, status: p.status ?? "Approved" }),
    }),
  depositCredited: (p: BaseProps) =>
    plainTransactionalEmail({
      heading: "Deposit credited",
      name: p.name,
      intro: "Your deposit has been credited to your investment.",
      details: details({ ...p, status: p.status ?? "Credited" }),
    }),
  depositRejected: (p: BaseProps & { reason?: string }) =>
    plainTransactionalEmail({
      heading: "Deposit not approved",
      name: p.name,
      intro: "Unfortunately we were unable to approve your deposit.",
      details: details(p, p.reason ? [{ label: "Reason", value: p.reason }] : []),
    }),
  withdrawalSubmitted: (
    p: BaseProps & {
      username?: string;
      charges?: string;
      netAmount?: string;
      method?: string;
      requestDate?: string;
      processingEstimate?: string;
    },
  ) => {
    const greetingName = p.username ?? p.name;
    const summary: DetailLine[] = [];
    if (p.amount) summary.push({ label: "Amount", value: p.amount });
    if (p.charges) summary.push({ label: "Charges", value: p.charges });
    if (p.netAmount ?? p.amount) {
      summary.push({ label: "Net amount", value: p.netAmount ?? p.amount ?? "—" });
    }
    if (p.method) summary.push({ label: "Method", value: p.method });
    if (p.referenceId) summary.push({ label: "Reference", value: p.referenceId });
    if (p.requestDate) summary.push({ label: "Request date", value: p.requestDate });

    return plainTransactionalEmail({
      heading: "Withdrawal Request Submitted",
      name: greetingName,
      intro: "Your withdrawal request has been received successfully.",
      details: summary,
      footerNote: "If you did not request this withdrawal, please contact support immediately.",
      cta: { label: "View Dashboard", href: p.dashboardUrl ?? defaultDashboard() },
    });
  },
  withdrawalApproved: (p: BaseProps) =>
    plainTransactionalEmail({
      heading: "Withdrawal approved",
      name: p.name,
      intro: "Your withdrawal request has been approved.",
      details: details(p),
    }),
  withdrawalCompleted: (p: BaseProps) =>
    plainTransactionalEmail({
      heading: "Withdrawal paid",
      name: p.name,
      intro: "Your withdrawal has been paid successfully.",
      details: details({ ...p, status: p.status ?? "Paid" }),
    }),
  withdrawalRejected: (p: BaseProps & { reason?: string }) =>
    plainTransactionalEmail({
      heading: "Withdrawal not approved",
      name: p.name,
      intro: "We were unable to approve your withdrawal request.",
      details: details(p, p.reason ? [{ label: "Reason", value: p.reason }] : []),
    }),
  investmentActivated: (p: BaseProps & { planName?: string }) =>
    plainTransactionalEmail({
      heading: "Investment activated",
      name: p.name,
      intro: "Your investment has been activated.",
      details: details(p, p.planName ? [{ label: "Plan", value: p.planName }] : []),
    }),
  dailyRoi: (p: BaseProps & { roiAmount?: string }) => {
    const credited = p.roiAmount || p.amount || "+$0.00";
    return plainTransactionalEmail({
      heading: "Daily ROI Successfully Credited",
      name: p.name,
      intro:
        "Great news! Your investment has generated today's return, and it has been successfully credited to your Unique Sky Way investment account.",
      introSecondary:
        "Your money is working for you—another day, another step toward growing your wealth.",
      detailsTitle: "Today's Earnings",
      details: [
        { label: "Daily ROI Credited", value: credited },
        { label: "Amount Added to Your Account", value: credited },
        { label: "Investment Status", value: "Active & Earning" },
      ],
      footerNote:
        "Your updated balance and transaction history are now available in your dashboard. Thank you for investing with Unique Sky Way. We're committed to helping your investments grow securely, consistently, and transparently.",
      supportLead: "If you have any questions, our Investor Success Team is always available at",
      closingTagline: "Invest Smart. Grow Daily. Build Wealth.",
      cta: { label: "View Portfolio", href: p.dashboardUrl ?? defaultDashboard() },
    });
  },
  investmentMatured: (p: BaseProps & { planName?: string }) =>
    plainTransactionalEmail({
      heading: "Investment cycle completed",
      name: p.name,
      intro: "Your investment has reached maturity and this cycle is complete.",
      details: details(p, p.planName ? [{ label: "Plan", value: p.planName }] : []),
    }),
  reinvestmentCompleted: (p: BaseProps & { planName?: string }) =>
    plainTransactionalEmail({
      heading: "Investment cycle completed",
      name: p.name,
      intro: "Your previous cycle completed and reinvestment is now active.",
      details: details(p, p.planName ? [{ label: "Plan", value: p.planName }] : []),
    }),
  referralCommission: (
    p: BaseProps & {
      commissionAmount?: string;
      referralName?: string;
      referralBalance?: string;
      totalReferralEarnings?: string;
    },
  ) => {
    const extra: DetailLine[] = [];
    if (p.referralName) extra.push({ label: "Referral", value: p.referralName });
    if (p.commissionAmount) extra.push({ label: "Commission earned", value: p.commissionAmount });
    if (p.referralBalance) extra.push({ label: "Referral balance", value: p.referralBalance });
    if (p.totalReferralEarnings) {
      extra.push({ label: "Total referral earnings", value: p.totalReferralEarnings });
    }
    return plainTransactionalEmail({
      heading: "Referral commission earned",
      name: p.name,
      intro: "A referral commission has been credited to your account.",
      details: details(p, extra),
    });
  },
  withdrawalCancelled: (p: BaseProps) =>
    plainTransactionalEmail({
      heading: "Withdrawal cancelled",
      name: p.name,
      intro: "Your withdrawal request has been cancelled.",
      details: details({ ...p, status: p.status ?? "Cancelled" }),
    }),
  referralRegistered: (p: BaseProps & { referralName?: string; referralUsername?: string }) =>
    plainTransactionalEmail({
      heading: "New referral registered",
      name: p.name,
      intro: "Someone created an account using your referral link.",
      details: details(p, [
        ...(p.referralName ? [{ label: "New member", value: p.referralName }] : []),
        ...(p.referralUsername ? [{ label: "Username", value: `@${p.referralUsername}` }] : []),
      ]),
    }),
  accountSuspended: (p: BaseProps & { reason?: string }) =>
    plainTransactionalEmail({
      heading: "Account suspended",
      name: p.name,
      intro: "Your investor account has been suspended by an administrator.",
      details: details(p, p.reason ? [{ label: "Reason", value: p.reason }] : []),
    }),
  accountReactivated: (p: BaseProps) =>
    plainTransactionalEmail({
      heading: "Account reactivated",
      name: p.name,
      intro: "Your investor account has been reactivated.",
      details: details(p, [{ label: "Status", value: "Active" }]),
    }),
  broadcast: (p: { name: string; title: string; body: string }) =>
    plainTransactionalEmail({
      heading: p.title,
      name: p.name,
      intro: p.body,
    }),
};

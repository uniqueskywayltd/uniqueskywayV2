import { TransactionalEmail, type DetailLine } from "./components/transactional-email";
import { getBrand } from "./brand";

type AdminAlertProps = {
  preview: string;
  heading: string;
  intro: string;
  details: DetailLine[];
  ctaLabel: string;
  ctaHref: string;
  badgeLabel?: string;
  badgeTone?: "success" | "warning" | "danger" | "neutral";
};

function AdminAlertEmail(props: AdminAlertProps) {
  return (
    <TransactionalEmail
      preview={props.preview}
      heading={props.heading}
      badge={{
        label: props.badgeLabel ?? "Admin alert",
        tone: props.badgeTone ?? "warning",
      }}
      name="Administrator"
      intro={props.intro}
      details={props.details}
      detailsTitle="Details"
      cta={{ label: props.ctaLabel, href: props.ctaHref }}
      includeSupportEmail
    />
  );
}

function adminUrl(path: string) {
  return `${getBrand().url}${path.startsWith("/") ? path : `/${path}`}`;
}

export function AdminNewRegistrationEmail(props: {
  customerName?: string;
  username?: string;
  email?: string;
  country?: string;
  stateRegion?: string;
  registeredAt?: string;
  customerId?: string;
  referralCode?: string;
  verificationStatus?: string;
  adminDashboardUrl?: string;
}) {
  const details: DetailLine[] = [
    { label: "Customer Name", value: props.customerName ?? "—" },
    { label: "Username", value: props.username ?? "—" },
    { label: "Email Address", value: props.email ?? "—" },
    { label: "Country", value: props.country ?? "—" },
  ];
  if (props.stateRegion) details.push({ label: "State/Province", value: props.stateRegion });
  details.push(
    { label: "Registration Date & Time", value: props.registeredAt ?? "—" },
    { label: "Customer ID", value: props.customerId ?? "—" },
    { label: "Referral Code", value: props.referralCode?.trim() || "None" },
    { label: "Verification Status", value: props.verificationStatus ?? "Unverified" },
  );

  return (
    <AdminAlertEmail
      preview="New customer registration"
      heading="New Customer Registration"
      intro="A new customer account was created on Unique Sky Way."
      details={details}
      ctaLabel="View Customer"
      ctaHref={props.adminDashboardUrl ?? adminUrl("/admin/customers")}
      badgeLabel="New customer"
      badgeTone="success"
    />
  );
}

export function AdminDepositReviewEmail(props: {
  customerName?: string;
  customerEmail?: string;
  currency?: string;
  network?: string;
  amount?: string;
  transactionHash?: string;
  referenceId?: string;
  requestDate?: string;
  adminDashboardUrl?: string;
  heading?: string;
  intro?: string;
  badgeLabel?: string;
  badgeTone?: "success" | "warning" | "danger" | "neutral";
  ctaLabel?: string;
}) {
  return (
    <AdminAlertEmail
      preview={props.heading ?? "Deposit update"}
      heading={props.heading ?? "New Deposit Awaiting Review"}
      intro={props.intro ?? "A customer deposit requires your attention."}
      badgeLabel={props.badgeLabel ?? "Awaiting Review"}
      badgeTone={props.badgeTone ?? "warning"}
      details={[
        { label: "Customer Name", value: props.customerName ?? "—" },
        { label: "Email", value: props.customerEmail ?? "—" },
        { label: "Currency", value: props.currency ?? "USD" },
        { label: "Network", value: props.network ?? "—" },
        { label: "Amount", value: props.amount ?? "—", highlight: true },
        { label: "Transaction Hash", value: props.transactionHash ?? "—" },
        { label: "Reference", value: props.referenceId ?? "—" },
        { label: "Submission Time", value: props.requestDate ?? "—" },
      ]}
      ctaLabel={props.ctaLabel ?? "Review Deposit"}
      ctaHref={props.adminDashboardUrl ?? adminUrl("/admin/deposits")}
    />
  );
}

export function AdminWithdrawalReviewEmail(props: {
  customerName?: string;
  amount?: string;
  currency?: string;
  destination?: string;
  referenceId?: string;
  requestDate?: string;
  adminDashboardUrl?: string;
  heading?: string;
  intro?: string;
  badgeLabel?: string;
  badgeTone?: "success" | "warning" | "danger" | "neutral";
  ctaLabel?: string;
}) {
  return (
    <AdminAlertEmail
      preview={props.heading ?? "Withdrawal update"}
      heading={props.heading ?? "New Withdrawal Request"}
      intro={props.intro ?? "A customer withdrawal requires your attention."}
      badgeLabel={props.badgeLabel ?? "Pending Review"}
      badgeTone={props.badgeTone ?? "warning"}
      details={[
        { label: "Customer Name", value: props.customerName ?? "—" },
        { label: "Amount", value: props.amount ?? "—", highlight: true },
        { label: "Currency", value: props.currency ?? "USD" },
        { label: "Destination", value: props.destination ?? "—" },
        { label: "Reference", value: props.referenceId ?? "—" },
        { label: "Request Time", value: props.requestDate ?? "—" },
      ]}
      ctaLabel={props.ctaLabel ?? "Review Withdrawal"}
      ctaHref={props.adminDashboardUrl ?? adminUrl("/admin/withdrawals")}
    />
  );
}

export function AdminInvestmentStartedEmail(props: {
  customerName?: string;
  planName?: string;
  amount?: string;
  dailyRoi?: string;
  duration?: string;
  expectedRoi?: string;
  maturityValue?: string;
  startDateTime?: string;
  referenceId?: string;
  adminDashboardUrl?: string;
}) {
  return (
    <AdminAlertEmail
      preview="New investment started"
      heading="New Investment Started"
      intro="A customer has started a new investment."
      badgeLabel="Investment active"
      badgeTone="success"
      details={[
        { label: "Customer Name", value: props.customerName ?? "—" },
        { label: "Investment Plan", value: props.planName ?? "—" },
        { label: "Investment Amount", value: props.amount ?? "—", highlight: true },
        { label: "Daily ROI", value: props.dailyRoi ?? "—" },
        { label: "Duration", value: props.duration ?? "—" },
        { label: "Expected ROI", value: props.expectedRoi ?? "—" },
        { label: "Expected Maturity Value", value: props.maturityValue ?? "—" },
        { label: "Investment Start Time", value: props.startDateTime ?? "—" },
        { label: "Reference", value: props.referenceId ?? "—" },
      ]}
      ctaLabel="View Investment"
      ctaHref={props.adminDashboardUrl ?? adminUrl("/admin/investments")}
    />
  );
}

export function AdminGenericNoticeEmail(props: {
  preview: string;
  heading: string;
  intro: string;
  details: DetailLine[];
  ctaLabel: string;
  ctaHref: string;
  badgeLabel?: string;
  badgeTone?: "success" | "warning" | "danger" | "neutral";
}) {
  return <AdminAlertEmail {...props} />;
}

import { formatEmailDateTime } from "@/emails/format-datetime";
import { TransactionalEmail } from "./components/transactional-email";

type NewDeviceLoginEmailProps = {
  name: string;
  ipAddress: string;
  browser: string;
  os: string;
  device?: string;
  approximateLocation?: string | null;
  loginTime: string;
  sessionsUrl: string;
};

/**
 * Single security alert for unrecognized-device sign-ins.
 * Not sent for returning trusted devices.
 */
export default function NewDeviceLoginEmail({
  name,
  ipAddress,
  browser,
  os,
  device,
  approximateLocation,
  loginTime,
  sessionsUrl,
}: NewDeviceLoginEmailProps) {
  const deviceLabel = device ?? `${browser} on ${os}`;
  const dateTime = formatEmailDateTime(loginTime);
  const details = [
    { label: "Device", value: deviceLabel },
    { label: "Browser", value: browser },
    { label: "Operating system", value: os },
    { label: "IP address", value: ipAddress },
    ...(approximateLocation ? [{ label: "Approximate location", value: approximateLocation }] : []),
    { label: "Date / time", value: dateTime },
  ];

  return (
    <TransactionalEmail
      preview="New device signed in to your Unique Sky Way account"
      heading="New device sign-in"
      badge={{ label: "Security alert", tone: "warning" }}
      name={name}
      intro="We noticed a sign-in from a device we don't recognize. Review the details below and secure your account if this wasn't you."
      details={details}
      detailsTitle="Sign-in details"
      footerNote="If this wasn't you, change your password immediately and review active sessions."
      cta={{ label: "Review active sessions", href: sessionsUrl }}
    />
  );
}

NewDeviceLoginEmail.PreviewProps = {
  name: "Alex Morgan",
  ipAddress: "192.168.1.42",
  browser: "Safari",
  os: "iOS",
  device: "Safari on iOS",
  approximateLocation: "Fayetteville, Arkansas, US",
  loginTime: "2026-07-06T15:42:00.000Z",
  sessionsUrl: "https://uniqueskyway.com/account/security/sessions",
} satisfies NewDeviceLoginEmailProps;

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
  const details = [
    { label: "Device", value: deviceLabel },
    { label: "Browser", value: browser },
    { label: "Operating system", value: os },
    { label: "IP address", value: ipAddress },
    ...(approximateLocation ? [{ label: "Location", value: approximateLocation }] : []),
    { label: "Login time", value: loginTime },
  ];

  return (
    <TransactionalEmail
      preview="New device signed in to your Unique Sky Way account"
      heading="New device sign-in"
      badge={{ label: "Security alert", tone: "warning" }}
      name={name}
      intro="We noticed a sign-in from a device we don't recognize. Review the details below."
      details={details}
      footerNote="If this wasn't you, secure your account immediately."
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
  loginTime: "July 6, 2026 at 3:42 PM UTC",
  sessionsUrl: "https://uniqueskyway.com/dashboard/security",
} satisfies NewDeviceLoginEmailProps;

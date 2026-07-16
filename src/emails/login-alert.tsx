import { getBrand } from "@/emails/brand";
import { TransactionalEmail } from "./components/transactional-email";

type LoginAlertEmailProps = {
  name: string;
  device: string;
  ipAddress: string;
  loginTime: string;
  securityUrl?: string;
};

/** Trusted-device / general sign-in alert (production preview: login-alert.html). */
export default function LoginAlertEmail({
  name,
  device,
  ipAddress,
  loginTime,
  securityUrl,
}: LoginAlertEmailProps) {
  const brand = getBrand();
  return (
    <TransactionalEmail
      preview="New sign-in to your Unique Sky Way account"
      heading="New sign-in detected"
      badge={{ label: "Security", tone: "neutral" }}
      name={name}
      intro={`Your account was signed in to on ${loginTime}. If this activity looks unfamiliar, secure your account immediately.`}
      details={[
        { label: "Device", value: device },
        { label: "IP address", value: ipAddress },
        { label: "Time", value: loginTime },
      ]}
      footerNote={`If this wasn't you, change your password immediately and contact ${brand.email}.`}
      cta={{
        label: "Review account security",
        href: securityUrl ?? `${brand.url}/account/security`,
      }}
    />
  );
}

LoginAlertEmail.PreviewProps = {
  name: "Alex Morgan",
  device: "Chrome on macOS",
  ipAddress: "192.168.1.42",
  loginTime: "July 6, 2026 at 3:42 PM UTC",
} satisfies LoginAlertEmailProps;

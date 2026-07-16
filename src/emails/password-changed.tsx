import { Text } from "@react-email/components";
import { getBrand } from "@/emails/brand";
import { EmailLayout, text } from "./components/layout";

type PasswordChangedEmailProps = {
  name: string;
  changedAt: string;
  securityUrl?: string;
};

export default function PasswordChangedEmail({
  name,
  changedAt,
  securityUrl,
}: PasswordChangedEmailProps) {
  const brand = getBrand();
  const href = securityUrl ?? `${brand.url}/account/security`;

  return (
    <EmailLayout
      preview="Your Unique Sky Way password was changed"
      heading="Password changed"
      badge={{ label: "Security alert", tone: "success" }}
      cta={{ label: "Review security settings", href }}
    >
      <Text style={text.primary}>
        Hi <span style={text.strong}>{name}</span>,
      </Text>
      <Text style={text.primary}>
        Your password was successfully changed on <span style={text.strong}>{changedAt}</span>. All
        active sessions on other devices may require you to sign in again.
      </Text>
      <Text style={text.muted}>
        If you did not make this change, contact us immediately at {brand.email} and review your
        active sessions from the security settings in your dashboard.
      </Text>
    </EmailLayout>
  );
}

PasswordChangedEmail.PreviewProps = {
  name: "Alex Morgan",
  changedAt: "July 6, 2026 at 3:42 PM UTC",
} satisfies PasswordChangedEmailProps;

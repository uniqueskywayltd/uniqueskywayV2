import { Text } from "@react-email/components";
import { getBrand } from "@/emails/brand";
import { EmailDetailTable } from "./components/transactional-email";
import { EmailLayout, text } from "./components/layout";

type RegistrationWelcomeEmailProps = {
  firstName: string;
  username: string;
  emailVerified?: boolean;
  temporaryPassword?: string | null;
  mustChangePassword?: boolean;
  loginUrl?: string;
};

export default function RegistrationWelcomeEmail({
  firstName,
  username,
  emailVerified = false,
  temporaryPassword,
  mustChangePassword = false,
  loginUrl,
}: RegistrationWelcomeEmailProps) {
  const brand = getBrand();
  const verificationStatus = emailVerified ? "Verified" : "Pending verification";
  const nextStep = temporaryPassword
    ? "Sign in with your temporary password, then change it immediately."
    : emailVerified
      ? "Sign in and complete your first deposit."
      : "Verify your email, then sign in to fund your investment.";
  const details = [
    { label: "Username", value: username.startsWith("@") ? username : `@${username}` },
    { label: "Account status", value: "Active" },
    { label: "Email verification", value: verificationStatus },
  ];
  if (temporaryPassword) {
    details.push({ label: "Temporary password", value: temporaryPassword });
  }
  if (mustChangePassword) {
    details.push({ label: "Password change", value: "Required on first sign-in" });
  }

  return (
    <EmailLayout
      preview={`Welcome to ${brand.name}`}
      heading={`Welcome to ${brand.name}`}
      badge={{ label: "Account created", tone: "success" }}
      cta={{ label: "Open dashboard", href: loginUrl ?? `${brand.url}/dashboard` }}
    >
      <Text style={text.primary}>
        Hi <strong>{firstName}</strong>, your investor account has been created successfully.
      </Text>
      <EmailDetailTable title="Account details" details={details} />
      <Text style={text.primary}>
        <strong>Next step:</strong> {nextStep}
      </Text>
      <Text style={text.muted}>
        Need help? Contact our support team at{" "}
        <a href={`mailto:${brand.email}`} style={{ color: "#1e3a5f" }}>
          {brand.email}
        </a>
        .
      </Text>
    </EmailLayout>
  );
}

RegistrationWelcomeEmail.PreviewProps = {
  firstName: "Alex",
  username: "alexmorgan",
  emailVerified: false,
} satisfies RegistrationWelcomeEmailProps;

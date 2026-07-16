import { Text } from "@react-email/components";
import { EmailLayout, text } from "./components/layout";
import { EmailOtpBlock } from "./components/otp-block";

type VerifyEmailProps = {
  name: string;
  verifyUrl: string;
  otp: string;
};

/**
 * Signup verification email — single message with OTP + magic link.
 * Matches the create-account → OTP modal / verify-link flow.
 */
export default function VerifyEmail({ name, verifyUrl, otp }: VerifyEmailProps) {
  return (
    <EmailLayout
      preview="Your Unique Sky Way verification code"
      heading="Verify your email"
      badge={{ label: "Action required", tone: "warning" }}
      cta={{ label: "Verify email address", href: verifyUrl }}
    >
      <Text style={text.primary}>
        Hi <span style={text.strong}>{name}</span>,
      </Text>
      <Text style={text.primary}>
        Enter the verification code below in the signup window, or click the button to verify your
        email address and complete your account setup. Verified accounts unlock deposits,
        investments, and secure portfolio access.
      </Text>
      <EmailOtpBlock otp={otp} />
      <Text style={text.muted}>
        This verification code and link expire in 24 hours. If you did not create an account, you
        can ignore this email.
      </Text>
    </EmailLayout>
  );
}

VerifyEmail.PreviewProps = {
  name: "Alex Morgan",
  verifyUrl:
    "https://uniqueskyway.com/auth/verify?token=example&type=verify&email=alex%40example.com",
  otp: "48291367",
} satisfies VerifyEmailProps;

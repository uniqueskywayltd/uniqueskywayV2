import { Text } from "@react-email/components";
import { getBrand } from "@/emails/brand";
import { EmailLayout, text } from "./components/layout";

type WelcomeEmailProps = {
  name: string;
};

/**
 * Delayed signup welcome (≈35 minutes after registration).
 * Nudges email verification — distinct from the immediate OTP verify email.
 */
export default function WelcomeEmail({ name }: WelcomeEmailProps) {
  const brand = getBrand();

  return (
    <EmailLayout
      preview={`Welcome to ${brand.name}`}
      heading={`Welcome, ${name}`}
      badge={{ label: "New account", tone: "success" }}
    >
      <Text style={text.primary}>
        Thank you for opening an investor account with {brand.name}. We&apos;re glad to have you on
        board.
      </Text>
      <Text style={text.primary}>
        Please verify your email address to activate your account and access your secure investor
        dashboard — portfolio overview, deposits, withdrawals, and full transaction history.
      </Text>
      <Text style={text.muted}>
        If you didn&apos;t create this account, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}

WelcomeEmail.PreviewProps = {
  name: "Alex Morgan",
} satisfies WelcomeEmailProps;

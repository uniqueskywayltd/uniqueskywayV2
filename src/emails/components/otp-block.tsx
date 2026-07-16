import { Section, Text } from "@react-email/components";
import { emailColors, emailMono } from "./tokens";

type EmailOtpBlockProps = {
  otp: string;
  hint?: string;
};

export function EmailOtpBlock({
  otp,
  hint = "Enter this code in the verification window, or use the button below.",
}: EmailOtpBlockProps) {
  return (
    <Section style={wrap}>
      <Text style={label}>Your verification code</Text>
      <Text style={code}>{otp}</Text>
      <Text style={hintStyle}>{hint}</Text>
    </Section>
  );
}

const wrap = {
  margin: "24px 0 8px",
  padding: "20px",
  backgroundColor: emailColors.neutralBg,
  borderRadius: "12px",
  border: `1px solid ${emailColors.neutralBorder}`,
  textAlign: "center" as const,
};

const label = {
  margin: "0 0 8px",
  fontSize: "12px",
  fontWeight: "600" as const,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: emailColors.muted,
};

const code = {
  margin: "0",
  fontSize: "32px",
  fontWeight: "700" as const,
  letterSpacing: "0.35em",
  color: emailColors.heading,
  fontFamily: emailMono,
};

const hintStyle = {
  margin: "12px 0 0",
  fontSize: "13px",
  lineHeight: "20px",
  color: emailColors.muted,
};

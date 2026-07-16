import type { ReactNode } from "react";
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { getBrand } from "@/emails/brand";
import { emailColors, emailFont } from "./tokens";

export { getBrand as brand };

export type EmailBadgeTone = "success" | "warning" | "danger" | "neutral";

type EmailLayoutProps = {
  preview: string;
  heading: string;
  children: ReactNode;
  cta?: { label: string; href: string } | undefined;
  secondaryCta?: { label: string; href: string } | undefined;
  badge?: { label: string; tone?: EmailBadgeTone } | undefined;
};

const badgeColors: Record<EmailBadgeTone, { bg: string; text: string; border: string }> = {
  success: {
    bg: emailColors.successBg,
    text: emailColors.successText,
    border: emailColors.successBorder,
  },
  warning: {
    bg: emailColors.warningBg,
    text: emailColors.warningText,
    border: emailColors.warningBorder,
  },
  danger: {
    bg: emailColors.dangerBg,
    text: emailColors.dangerText,
    border: emailColors.dangerBorder,
  },
  neutral: {
    bg: emailColors.neutralBg,
    text: emailColors.neutralText,
    border: emailColors.neutralBorder,
  },
};

export function EmailLayout({
  preview,
  heading,
  children,
  cta,
  secondaryCta,
  badge,
}: EmailLayoutProps) {
  const brand = getBrand();
  const year = new Date().getFullYear();
  const badgeStyle = badge ? badgeColors[badge.tone ?? "neutral"] : null;

  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={shell}>
          <Section style={headerSection}>
            <Img src={brand.logoUrl} width="180" height="60" alt={brand.name} style={logo} />
          </Section>

          <Section style={headerSubSection}>
            <Text style={headerTagline}>{brand.tagline}</Text>
            <Text style={headerMeta}>Encrypted sessions · Immutable audit trail</Text>
          </Section>

          <Section style={card}>
            {badge && badgeStyle ? (
              <Text
                style={{
                  ...badgeBase,
                  backgroundColor: badgeStyle.bg,
                  color: badgeStyle.text,
                  border: `1px solid ${badgeStyle.border}`,
                }}
              >
                {badge.label}
              </Text>
            ) : null}
            <Heading style={headingStyle}>{heading}</Heading>
            {children}
            {cta || secondaryCta ? (
              <Section style={buttonSection}>
                {cta ? (
                  <Button style={button} href={cta.href}>
                    {cta.label}
                  </Button>
                ) : null}
                {secondaryCta ? (
                  <Button
                    style={{ ...buttonSecondary, marginLeft: cta ? "10px" : "0" }}
                    href={secondaryCta.href}
                  >
                    {secondaryCta.label}
                  </Button>
                ) : null}
              </Section>
            ) : null}
          </Section>

          <Section style={footerSection}>
            <Row style={footerRow}>
              <Column align="center">
                <Text style={footerCopy}>
                  © {year} {brand.name}. All rights reserved.
                </Text>
                <Text style={footerLinks}>
                  <Link href={brand.marketingUrl ?? brand.url} style={footerLink}>
                    Website
                  </Link>
                  {" · "}
                  <Link href={`${brand.url}/dashboard`} style={footerLink}>
                    Dashboard
                  </Link>
                  {" · "}
                  <Link href={`${brand.marketingUrl ?? brand.url}/security`} style={footerLink}>
                    Security
                  </Link>
                </Text>
                <Hr style={footerDivider} />
                <Text style={footerLegal}>
                  This is a transactional message from {brand.name}. Reply to this email if you need
                  help or have questions.
                </Text>
                <Text style={footerSecure}>
                  Secure investor communications · Fayetteville, Arkansas
                </Text>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: emailColors.canvas,
  margin: "0",
  padding: "40px 16px",
  fontFamily: emailFont,
};

const shell = {
  margin: "0 auto",
  maxWidth: "600px",
};

const headerSection = {
  backgroundColor: emailColors.header,
  borderRadius: "16px 16px 0 0",
  padding: "32px 32px 24px",
  textAlign: "center" as const,
  border: `1px solid ${emailColors.headerBorder}`,
  borderBottom: "none",
};

const logo = {
  margin: "0 auto",
  display: "block",
};

const headerSubSection = {
  backgroundColor: emailColors.headerSub,
  padding: "16px 32px 18px",
  textAlign: "center" as const,
  borderLeft: `1px solid ${emailColors.headerBorder}`,
  borderRight: `1px solid ${emailColors.headerBorder}`,
  borderBottom: `1px solid ${emailColors.headerBorder}`,
};

const headerTagline = {
  color: emailColors.headerTagline,
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "0.16em",
  textTransform: "uppercase" as const,
  margin: "0 0 6px",
  lineHeight: "16px",
};

const headerMeta = {
  color: emailColors.headerMeta,
  fontSize: "11px",
  fontWeight: "500",
  letterSpacing: "0.02em",
  margin: "0",
  lineHeight: "16px",
};

const card = {
  backgroundColor: emailColors.card,
  padding: "32px 32px 36px",
  borderLeft: `1px solid ${emailColors.cardBorder}`,
  borderRight: `1px solid ${emailColors.cardBorder}`,
  borderTop: `3px solid ${emailColors.cardAccent}`,
};

const badgeBase = {
  display: "inline-block",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  borderRadius: "999px",
  padding: "6px 12px",
  margin: "0 0 16px",
  lineHeight: "16px",
};

const headingStyle = {
  color: emailColors.heading,
  fontSize: "26px",
  fontWeight: "700",
  letterSpacing: "-0.02em",
  lineHeight: "32px",
  margin: "0 0 20px",
};

const buttonSection = { textAlign: "center" as const, marginTop: "28px" };

const button = {
  backgroundColor: emailColors.ctaBg,
  borderRadius: "10px",
  color: emailColors.ctaText,
  fontSize: "14px",
  fontWeight: "700",
  textDecoration: "none",
  padding: "14px 32px",
  display: "inline-block",
};

const buttonSecondary = {
  backgroundColor: "transparent",
  borderRadius: "10px",
  color: emailColors.heading,
  border: `1px solid ${emailColors.cardBorder}`,
  fontSize: "14px",
  fontWeight: "700",
  textDecoration: "none",
  padding: "13px 28px",
  display: "inline-block",
};

const footerSection = {
  backgroundColor: emailColors.footer,
  borderRadius: "0 0 16px 16px",
  padding: "32px 32px 36px",
  border: `1px solid ${emailColors.headerBorder}`,
  borderTop: "none",
};

const footerRow = { width: "100%" };

const footerCopy = {
  color: emailColors.footerText,
  fontSize: "12px",
  lineHeight: "20px",
  margin: "0 0 10px",
  textAlign: "center" as const,
};

const footerLinks = {
  color: emailColors.footerText,
  fontSize: "12px",
  lineHeight: "22px",
  margin: "0 0 16px",
  textAlign: "center" as const,
};

const footerLink = {
  color: emailColors.footerLink,
  textDecoration: "underline",
};

const footerDivider = {
  borderColor: emailColors.headerBorder,
  margin: "0 0 16px",
};

const footerLegal = {
  color: emailColors.footerMuted,
  fontSize: "11px",
  lineHeight: "18px",
  margin: "0 0 10px",
  textAlign: "center" as const,
};

const footerSecure = {
  color: emailColors.footerMuted,
  fontSize: "10px",
  fontWeight: "600",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  lineHeight: "16px",
  margin: "0",
  textAlign: "center" as const,
};

export const text = {
  primary: {
    color: emailColors.body,
    fontSize: "15px",
    lineHeight: "26px",
    margin: "0 0 16px",
  },
  muted: {
    color: emailColors.muted,
    fontSize: "13px",
    lineHeight: "22px",
    margin: "16px 0 0",
  },
  strong: {
    color: emailColors.heading,
    fontWeight: "600",
  },
};

export const linkStyle = {
  color: emailColors.link,
  textDecoration: "underline",
};

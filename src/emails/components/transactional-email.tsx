import { Column, Row, Section, Text } from "@react-email/components";
import { getBrand } from "@/emails/brand";
import { EmailLayout, text, linkStyle } from "./layout";
import { emailColors, emailMono } from "./tokens";

export type DetailLine = {
  label: string;
  value: string;
  highlight?: boolean;
};

type TransactionalEmailProps = {
  preview: string;
  heading: string;
  name: string;
  intro: string;
  /** Optional second paragraph under the intro (reinforcement / reassurance). */
  introSecondary?: string | undefined;
  details?: DetailLine[] | undefined;
  detailsTitle?: string | undefined;
  processingEstimate?: string | undefined;
  securityWarning?: string | undefined;
  footerNote?: string | undefined;
  /** Soft paragraph after details (not an alert box). */
  bodyNote?: string | undefined;
  /** Premium brand line under the support blurb (e.g. Invest Smart. Grow Daily.). */
  closingTagline?: string | undefined;
  cta?: { label: string; href: string } | undefined;
  badge?: { label: string; tone?: "success" | "warning" | "danger" | "neutral" } | undefined;
  /** Defaults to a reply prompt — mail is already from support, so we do not restate the address. */
  supportLead?: string | undefined;
  /** When true, appends a mailto link for brand.email after supportLead. */
  includeSupportEmail?: boolean | undefined;
};

const DEFAULT_SUPPORT_LEAD = "Reply to this email if you need help or have questions.";

export function EmailDetailTable({
  details,
  title = "Transaction details",
}: {
  details: DetailLine[];
  title?: string | undefined;
}) {
  if (details.length === 0) return null;

  return (
    <Section style={detailWrap}>
      <Section style={detailHeader}>
        <Text style={detailHeaderText}>{title}</Text>
      </Section>
      <Section style={detailTable}>
        {details.map((line, index) => (
          <Row
            key={line.label}
            style={{
              ...detailRow,
              borderBottom:
                index < details.length - 1 ? `1px solid ${emailColors.detailBorder}` : "none",
            }}
          >
            <Column style={detailLabelCol}>
              <Text style={detailLabel}>{line.label}</Text>
            </Column>
            <Column style={detailValueCol}>
              <Text
                style={{
                  ...detailValue,
                  color: line.highlight ? emailColors.accentDark : emailColors.detailValue,
                  fontWeight: line.highlight ? "700" : "500",
                }}
              >
                {line.value}
              </Text>
            </Column>
          </Row>
        ))}
      </Section>
    </Section>
  );
}

export function TransactionalEmail({
  preview,
  heading,
  name,
  intro,
  introSecondary,
  details = [],
  detailsTitle,
  processingEstimate,
  securityWarning,
  footerNote,
  bodyNote,
  closingTagline,
  cta,
  badge,
  supportLead,
  includeSupportEmail = false,
}: TransactionalEmailProps) {
  const brand = getBrand();
  const supportText = supportLead ?? DEFAULT_SUPPORT_LEAD;
  return (
    <EmailLayout preview={preview} heading={heading} cta={cta} badge={badge}>
      <Text style={text.primary}>
        Hello <span style={text.strong}>{name}</span>,
      </Text>
      <Text style={text.primary}>{intro}</Text>
      {introSecondary ? <Text style={text.primary}>{introSecondary}</Text> : null}
      <EmailDetailTable details={details} title={detailsTitle} />
      {processingEstimate ? (
        <Section style={processingBox}>
          <Text style={processingLabel}>Estimated processing</Text>
          <Text style={processingValue}>{processingEstimate}</Text>
        </Section>
      ) : null}
      {securityWarning ? (
        <Section style={securityBox}>
          <Text style={securityLabel}>Security notice</Text>
          <Text style={securityText}>{securityWarning}</Text>
        </Section>
      ) : null}
      {bodyNote ? <Text style={text.primary}>{bodyNote}</Text> : null}
      {footerNote ? (
        <Section style={noticeBox}>
          <Text style={noticeLabel}>Important</Text>
          <Text style={noticeText}>{footerNote}</Text>
        </Section>
      ) : null}
      <Text style={text.muted}>
        {includeSupportEmail ? (
          <>
            {supportText}{" "}
            <a href={`mailto:${brand.email}`} style={linkStyle}>
              {brand.email}
            </a>
            .
          </>
        ) : (
          supportText
        )}
      </Text>
      {closingTagline ? (
        <Section style={closingWrap}>
          <Text style={closingBrand}>{brand.name}</Text>
          <Text style={closingTaglineStyle}>{closingTagline}</Text>
        </Section>
      ) : null}
    </EmailLayout>
  );
}

export function plainTransactionalEmail(params: {
  heading: string;
  name: string;
  intro: string;
  introSecondary?: string;
  details?: DetailLine[];
  detailsTitle?: string;
  footerNote?: string;
  closingTagline?: string;
  cta?: { label: string; href: string };
  supportLead?: string;
  includeSupportEmail?: boolean;
}): string {
  const brand = getBrand();
  const lines = [params.heading, "", `Hello ${params.name},`, "", params.intro, ""];

  if (params.introSecondary) {
    lines.push(params.introSecondary, "");
  }

  if (params.details?.length) {
    lines.push(`— ${params.detailsTitle ?? "Transaction details"} —`);
    for (const d of params.details) {
      lines.push(`${d.label}: ${d.value}`);
    }
    lines.push("");
  }

  if (params.footerNote) {
    lines.push(params.footerNote, "");
  }

  if (params.cta) {
    lines.push(`${params.cta.label}: ${params.cta.href}`, "");
  }

  const supportText = params.supportLead ?? DEFAULT_SUPPORT_LEAD;
  lines.push(params.includeSupportEmail ? `${supportText} ${brand.email}` : supportText);
  if (params.closingTagline) {
    lines.push("", brand.name, params.closingTagline);
  }
  lines.push(`© ${new Date().getFullYear()} ${brand.name}`);

  return lines.join("\n");
}

const detailWrap = {
  margin: "8px 0 20px",
  borderRadius: "12px",
  overflow: "hidden" as const,
  border: `1px solid ${emailColors.detailBorder}`,
};

const detailHeader = {
  backgroundColor: emailColors.detailHeaderBg,
  padding: "10px 16px",
};

const detailHeaderText = {
  color: "#94a3b8",
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  margin: "0",
  lineHeight: "14px",
};

const detailTable = {
  backgroundColor: emailColors.detailBg,
};

const detailRow = {
  width: "100%",
};

const detailLabelCol = {
  width: "38%",
  padding: "12px 16px",
  verticalAlign: "top" as const,
};

const detailValueCol = {
  width: "62%",
  padding: "12px 16px",
  verticalAlign: "top" as const,
};

const detailLabel = {
  color: emailColors.detailLabel,
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  margin: "0",
  lineHeight: "18px",
};

const detailValue = {
  color: emailColors.detailValue,
  fontSize: "14px",
  margin: "0",
  lineHeight: "20px",
  fontFamily: emailMono,
};

const noticeBox = {
  backgroundColor: emailColors.warningBg,
  borderRadius: "10px",
  border: `1px solid ${emailColors.warningBorder}`,
  borderLeft: `4px solid ${emailColors.accent}`,
  padding: "14px 16px",
  margin: "4px 0 16px",
};

const noticeLabel = {
  color: emailColors.warningText,
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  margin: "0 0 6px",
  lineHeight: "14px",
};

const noticeText = {
  color: "#92400e",
  fontSize: "13px",
  lineHeight: "22px",
  margin: "0",
};

const processingBox = {
  backgroundColor: emailColors.detailBg,
  borderRadius: "10px",
  border: `1px solid ${emailColors.detailBorder}`,
  padding: "14px 16px",
  margin: "0 0 16px",
};

const processingLabel = {
  color: emailColors.detailLabel,
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  margin: "0 0 4px",
  lineHeight: "14px",
};

const processingValue = {
  color: emailColors.heading,
  fontSize: "15px",
  fontWeight: "600",
  lineHeight: "22px",
  margin: "0",
};

const securityBox = {
  backgroundColor: emailColors.dangerBg,
  borderRadius: "10px",
  border: `1px solid ${emailColors.dangerBorder}`,
  borderLeft: `4px solid ${emailColors.danger}`,
  padding: "14px 16px",
  margin: "0 0 16px",
};

const securityLabel = {
  color: emailColors.dangerText,
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  margin: "0 0 6px",
  lineHeight: "14px",
};

const securityText = {
  color: "#991b1b",
  fontSize: "13px",
  lineHeight: "22px",
  margin: "0",
};

const closingWrap = {
  margin: "20px 0 0",
  paddingTop: "16px",
  borderTop: `1px solid ${emailColors.detailBorder}`,
};

const closingBrand = {
  color: emailColors.heading,
  fontSize: "15px",
  fontWeight: "700",
  margin: "0 0 4px",
  lineHeight: "22px",
};

const closingTaglineStyle = {
  color: emailColors.detailLabel,
  fontSize: "13px",
  fontStyle: "italic" as const,
  margin: "0",
  lineHeight: "20px",
};

import type { Metadata } from "next";

import {
  LegalDocumentPage,
  buildLegalMetadata,
} from "@/features/public/components/legal/legal-document-page";

export const metadata: Metadata = buildLegalMetadata("risk");

export default function RiskPage() {
  return <LegalDocumentPage pageKey="risk" />;
}

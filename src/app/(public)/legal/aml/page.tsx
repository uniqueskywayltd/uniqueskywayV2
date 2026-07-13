import type { Metadata } from "next";

import {
  LegalDocumentPage,
  buildLegalMetadata,
} from "@/features/public/components/legal/legal-document-page";

export const metadata: Metadata = buildLegalMetadata("aml");

export default function AmlPage() {
  return <LegalDocumentPage pageKey="aml" />;
}

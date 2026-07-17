import type { Metadata } from "next";

import {
  LegalDocumentPage,
  buildLegalMetadata,
} from "@/features/public/components/legal/legal-document-page";

export const metadata: Metadata = buildLegalMetadata("terms");

export default function TermsPage() {
  return <LegalDocumentPage pageKey="terms" numberedSections />;
}

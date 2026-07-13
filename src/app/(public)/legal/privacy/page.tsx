import type { Metadata } from "next";

import {
  LegalDocumentPage,
  buildLegalMetadata,
} from "@/features/public/components/legal/legal-document-page";

export const metadata: Metadata = buildLegalMetadata("privacy");

export default function PrivacyPage() {
  return <LegalDocumentPage pageKey="privacy" />;
}

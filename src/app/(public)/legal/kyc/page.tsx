import type { Metadata } from "next";

import {
  LegalDocumentPage,
  buildLegalMetadata,
} from "@/features/public/components/legal/legal-document-page";

export const metadata: Metadata = buildLegalMetadata("kyc");

export default function KycPage() {
  return <LegalDocumentPage pageKey="kyc" />;
}

import type { Metadata } from "next";

import {
  LegalDocumentPage,
  buildLegalMetadata,
} from "@/features/public/components/legal/legal-document-page";

export const metadata: Metadata = buildLegalMetadata("cookies");

export default function CookiesPage() {
  return <LegalDocumentPage pageKey="cookies" />;
}

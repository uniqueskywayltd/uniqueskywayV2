import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { StatementsEntryShell } from "@/features/customer/success/statements-entry-shell";

export default function StatementsPage() {
  return (
    <>
      <CustomerPageHeader
        title="Statements"
        description="Can I understand my financial history? Ledger-backed statements arrive in Sprint G2."
      />
      <StatementsEntryShell />
    </>
  );
}

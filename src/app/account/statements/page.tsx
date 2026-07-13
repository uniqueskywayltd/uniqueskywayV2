import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { StatementsExplorer } from "@/features/customer/statements/statements-explorer";

export default function StatementsPage() {
  return (
    <>
      <CustomerPageHeader
        title="Statements"
        description="Can I understand my financial history? Ledger-backed projections — not invented totals."
      />
      <StatementsExplorer />
    </>
  );
}

import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { StatementDetailView } from "@/features/customer/statements/statement-detail-view";

export default function StatementDetailPage() {
  return (
    <>
      <CustomerPageHeader
        title="Statement"
        description="Preview ledger-projected totals for this New York period before you download."
      />
      <StatementDetailView />
    </>
  );
}

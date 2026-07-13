import { PageContainer } from "@/components/layout/page-container";
import { CustomerPageSkeleton } from "@/features/customer/components/customer-loading";

export default function GlobalLoading() {
  return (
    <PageContainer className="py-10">
      <CustomerPageSkeleton />
    </PageContainer>
  );
}

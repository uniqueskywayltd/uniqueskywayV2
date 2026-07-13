import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { CustomerSuccessHub } from "@/features/customer/success/success-hub";

export default function CustomerSuccessPage() {
  return (
    <>
      <CustomerPageHeader
        title="Success"
        description="How can I become more successful? Guidance without reinventing your money home."
      />
      <CustomerSuccessHub />
    </>
  );
}

import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { SupportRequestForm } from "@/features/customer/components/support-request-form";

export default function SupportPage() {
  return (
    <>
      <CustomerPageHeader
        title="Support request"
        description="Tell us what you need. Status updates still appear in Notifications."
      />
      <SupportRequestForm />
    </>
  );
}

import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { WhatsNewPanel } from "@/features/customer/components/whats-new-panel";

export default function WhatsNewPage() {
  return (
    <>
      <CustomerPageHeader
        title="What’s New"
        description="Subtle product improvements after releases — not a marketing feed."
      />
      <WhatsNewPanel />
    </>
  );
}

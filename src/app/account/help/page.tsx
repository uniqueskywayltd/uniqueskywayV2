import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { HelpCenter } from "@/features/customer/components/help-center";

export default function HelpPage() {
  return (
    <>
      <CustomerPageHeader
        title="Help Center"
        description="Educational guidance over approved articles. Search first — then support if needed."
      />
      <HelpCenter />
    </>
  );
}

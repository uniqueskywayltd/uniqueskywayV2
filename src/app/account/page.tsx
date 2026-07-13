import { AccountOverview } from "@/features/customer/components/account-overview";
import { CustomerPageHeader } from "@/features/customer/components/page-header";

export default function AccountPage() {
  return (
    <>
      <CustomerPageHeader
        title="Account"
        description="Your customer experience foundation is ready."
      />
      <AccountOverview />
    </>
  );
}

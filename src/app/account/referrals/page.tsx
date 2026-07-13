import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { ReferralSummary } from "@/features/customer/components/referral-summary";

export default function ReferralsPage() {
  return (
    <>
      <CustomerPageHeader
        title="Referrals"
        description="Read-only summary from the frozen referral engine — no invented rewards."
      />
      <ReferralSummary />
    </>
  );
}

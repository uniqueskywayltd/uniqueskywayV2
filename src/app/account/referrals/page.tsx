import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { ReferralHub } from "@/features/customer/referrals/referral-hub";

export default function ReferralsPage() {
  return (
    <>
      <CustomerPageHeader
        title="Referrals"
        description="How do I recommend this platform responsibly? Invitation tools over the frozen referral engine — no spam, no invented rewards."
      />
      <ReferralHub />
    </>
  );
}

import { ActivityTimeline } from "@/features/customer/components/activity-timeline";
import { CustomerPageHeader } from "@/features/customer/components/page-header";

export default function ActivityPage() {
  return (
    <>
      <CustomerPageHeader
        title="Activity"
        description="What have I done recently? Financial vs account/security — distinct from ledger postings."
      />
      <ActivityTimeline />
    </>
  );
}

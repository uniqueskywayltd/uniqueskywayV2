import { ActivityTimeline } from "@/features/customer/components/activity-timeline";
import { CustomerPageHeader } from "@/features/customer/components/page-header";

export default function ActivityPage() {
  return (
    <>
      <CustomerPageHeader title="Activity" description="Account and security activity timeline." />
      <ActivityTimeline />
    </>
  );
}

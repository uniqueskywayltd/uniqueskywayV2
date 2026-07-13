import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { CommunicationCenter } from "@/features/customer/components/communication-center";

export default function CommunicationsPage() {
  return (
    <>
      <CustomerPageHeader
        title="Communication Center"
        description="What do I need to know right now? Notifications, activity, help, referrals, and What’s New."
      />
      <CommunicationCenter />
    </>
  );
}

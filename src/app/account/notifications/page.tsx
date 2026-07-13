import { NotificationCenter } from "@/features/customer/components/notification-center";
import { CustomerPageHeader } from "@/features/customer/components/page-header";

export default function NotificationsPage() {
  return (
    <>
      <CustomerPageHeader
        title="Notifications"
        description="What do I need to know right now? Security first, then money that needs attention."
      />
      <NotificationCenter />
    </>
  );
}

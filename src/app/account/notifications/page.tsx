import { NotificationCenter } from "@/features/customer/components/notification-center";
import { CustomerPageHeader } from "@/features/customer/components/page-header";

export default function NotificationsPage() {
  return (
    <>
      <CustomerPageHeader
        title="Notifications"
        description="Search and review account notifications."
      />
      <NotificationCenter />
    </>
  );
}

import { ProfileManagement } from "@/features/customer/components/profile-management";
import { CustomerPageHeader } from "@/features/customer/components/page-header";

export default function ProfilePage() {
  return (
    <>
      <CustomerPageHeader title="Profile" description="Manage your personal information." />
      <ProfileManagement />
    </>
  );
}

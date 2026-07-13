import { PreferencesManagement } from "@/features/customer/components/preferences-management";
import { CustomerPageHeader } from "@/features/customer/components/page-header";

export default function PreferencesPage() {
  return (
    <>
      <CustomerPageHeader
        title="Preferences"
        description="Set language, time zone, appearance, and email preferences."
      />
      <PreferencesManagement />
    </>
  );
}

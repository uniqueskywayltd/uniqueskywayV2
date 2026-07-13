import { SecurityCenter } from "@/features/customer/components/security-center";
import { CustomerPageHeader } from "@/features/customer/components/page-header";

export default function SecurityPage() {
  return (
    <>
      <CustomerPageHeader
        title="Security"
        description="Manage password, trusted devices, and active sessions."
      />
      <SecurityCenter />
    </>
  );
}

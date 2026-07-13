import { TrustedDevicesClient } from "@/features/auth/components/security-management";
import { CustomerPageHeader } from "@/features/customer/components/page-header";

export default function TrustedDevicesPage() {
  return (
    <>
      <CustomerPageHeader
        title="Trusted devices"
        description="Review browsers trusted for this account."
      />
      <TrustedDevicesClient />
    </>
  );
}

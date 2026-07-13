import { SessionsClient } from "@/features/auth/components/security-management";
import { CustomerPageHeader } from "@/features/customer/components/page-header";

export default function SessionsPage() {
  return (
    <>
      <CustomerPageHeader
        title="Sessions"
        description="Review active authentication sessions and revoke sessions when needed."
      />
      <SessionsClient />
    </>
  );
}

import { AccountOverview } from "@/features/customer/components/account-overview";
import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { Button } from "@/components/ui";
import Link from "next/link";

export default function AccountPage() {
  return (
    <>
      <CustomerPageHeader
        title="Account"
        description="Profile, security, and preferences. Your primary financial home is the Dashboard."
        action={
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        }
      />
      <AccountOverview />
    </>
  );
}

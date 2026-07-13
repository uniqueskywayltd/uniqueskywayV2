import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { MilestonesShell } from "@/features/customer/success/milestones-shell";

export default function MilestonesPage() {
  return (
    <>
      <CustomerPageHeader
        title="Milestones"
        description="Real progress only — no streaks, points, or deposit pressure."
      />
      <MilestonesShell />
    </>
  );
}

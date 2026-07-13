import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { LearningHubShell } from "@/features/customer/success/learning-hub-shell";

export default function LearningPage() {
  return (
    <>
      <CustomerPageHeader
        title="Learning"
        description="What should I learn next? Honest explainers — articles deepen in Sprint G3."
      />
      <LearningHubShell />
    </>
  );
}

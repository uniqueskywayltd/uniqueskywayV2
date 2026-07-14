import { Suspense } from "react";

import { Skeleton } from "@/components/ui";
import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { LearningHome } from "@/features/customer/learning/learning-home";

export default function LearningPage() {
  return (
    <>
      <CustomerPageHeader
        title="Learning"
        description="What should I learn next? Calm, glossary-honest lessons — never an LMS maze."
      />
      <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" aria-label="Loading learning" />}>
        <LearningHome />
      </Suspense>
    </>
  );
}

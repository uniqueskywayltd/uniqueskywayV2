import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { LessonDetailView } from "@/features/customer/learning/lesson-detail-view";

export default function LessonPage() {
  return (
    <>
      <CustomerPageHeader
        title="Lesson"
        description="Read at your pace. Mark complete when ready — no points or certificates."
      />
      <LessonDetailView />
    </>
  );
}

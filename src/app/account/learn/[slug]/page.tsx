import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { LessonDetailView } from "@/features/customer/learning/lesson-detail-view";
import { getRequestLanguage } from "@/i18n/request-language";
import { createTranslator } from "@/i18n/translate";

export default async function LessonPage() {
  const { language } = await getRequestLanguage();
  const t = createTranslator(language);

  return (
    <>
      <CustomerPageHeader
        title={t("learn.lesson_page.title")}
        description={t("learn.lesson_page.description")}
      />
      <LessonDetailView />
    </>
  );
}

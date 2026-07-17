import { Suspense } from "react";

import { Skeleton } from "@/components/ui";
import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { LearningHome } from "@/features/customer/learning/learning-home";
import { getRequestLanguage } from "@/i18n/request-language";
import { createTranslator } from "@/i18n/translate";

export default async function LearningPage() {
  const { language } = await getRequestLanguage();
  const t = createTranslator(language);

  return (
    <>
      <CustomerPageHeader title={t("learn.page.title")} description={t("learn.page.description")} />
      <Suspense
        fallback={
          <Skeleton className="h-48 w-full rounded-xl" aria-label={t("learn.page.loading")} />
        }
      >
        <LearningHome />
      </Suspense>
    </>
  );
}

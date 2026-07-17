import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { MilestonesShell } from "@/features/customer/success/milestones-shell";
import { getRequestLanguage } from "@/i18n/request-language";
import { createTranslator } from "@/i18n/translate";

export default async function MilestonesPage() {
  const { language } = await getRequestLanguage();
  const t = createTranslator(language);

  return (
    <>
      <CustomerPageHeader
        title={t("success.milestones.title")}
        description={t("success.milestones.page_description")}
      />
      <MilestonesShell />
    </>
  );
}

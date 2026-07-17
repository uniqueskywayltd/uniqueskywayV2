import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { StatementsExplorer } from "@/features/customer/statements/statements-explorer";
import { getRequestLanguage } from "@/i18n/request-language";
import { createTranslator } from "@/i18n/translate";

export default async function StatementsPage() {
  const { language } = await getRequestLanguage();
  const t = createTranslator(language);

  return (
    <>
      <CustomerPageHeader
        title={t("statements.page.title")}
        description={t("statements.page.description")}
      />
      <StatementsExplorer />
    </>
  );
}

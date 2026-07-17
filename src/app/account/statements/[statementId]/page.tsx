import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { StatementDetailView } from "@/features/customer/statements/statement-detail-view";
import { getRequestLanguage } from "@/i18n/request-language";
import { createTranslator } from "@/i18n/translate";

export default async function StatementDetailPage() {
  const { language } = await getRequestLanguage();
  const t = createTranslator(language);

  return (
    <>
      <CustomerPageHeader
        title={t("statements.detail.page.title")}
        description={t("statements.detail.page.description")}
      />
      <StatementDetailView />
    </>
  );
}

import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { CustomerSuccessHub } from "@/features/customer/success/success-hub";
import { getRequestLanguage } from "@/i18n/request-language";
import { createTranslator } from "@/i18n/translate";

export default async function CustomerSuccessPage() {
  const { language } = await getRequestLanguage();
  const t = createTranslator(language);

  return (
    <>
      <CustomerPageHeader
        title={t("success.page.title")}
        description={t("success.page.description")}
      />
      <CustomerSuccessHub />
    </>
  );
}

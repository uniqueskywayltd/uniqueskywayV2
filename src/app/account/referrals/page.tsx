import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { ReferralHub } from "@/features/customer/referrals/referral-hub";
import { getRequestLanguage } from "@/i18n/request-language";
import { createTranslator } from "@/i18n/translate";

export default async function ReferralsPage() {
  const { language } = await getRequestLanguage();
  const t = createTranslator(language);

  return (
    <>
      <CustomerPageHeader
        title={t("referrals.title")}
        description={t("referrals.page.description")}
      />
      <ReferralHub />
    </>
  );
}

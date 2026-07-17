import { translate, type AppLanguage } from "@/i18n";

export const FAQ_CATEGORY_IDS = [
  "getting_started",
  "investments",
  "deposits",
  "withdrawals",
  "security",
  "verification",
  "accounts",
  "support",
] as const;

export type FaqCategoryId = (typeof FAQ_CATEGORY_IDS)[number];

export const FAQ_ITEM_IDS = [
  "create_account",
  "plan_immediately",
  "returns_guaranteed",
  "plan_terms_source",
  "compare_plans",
  "deposits_work",
  "deposit_status",
  "withdrawals_work",
  "balance_withdraw",
  "protect_account",
  "security_certifications",
  "verify_email",
  "identity_verification",
  "manage_sessions",
  "forget_password",
  "reach_us",
  "response_time",
] as const;

export type FaqItemId = (typeof FAQ_ITEM_IDS)[number];

const FAQ_ITEM_CATEGORIES: Record<FaqItemId, FaqCategoryId> = {
  create_account: "getting_started",
  plan_immediately: "getting_started",
  returns_guaranteed: "investments",
  plan_terms_source: "investments",
  compare_plans: "investments",
  deposits_work: "deposits",
  deposit_status: "deposits",
  withdrawals_work: "withdrawals",
  balance_withdraw: "withdrawals",
  protect_account: "security",
  security_certifications: "security",
  verify_email: "verification",
  identity_verification: "verification",
  manage_sessions: "accounts",
  forget_password: "accounts",
  reach_us: "support",
  response_time: "support",
};

export type FaqItem = {
  id: FaqItemId;
  category: FaqCategoryId;
  question: string;
  answer: string;
};

export type Translator = (key: string, values?: Record<string, string | number>) => string;

export function getFaqCategoryLabel(t: Translator, category: FaqCategoryId): string {
  return t(`faq.cat.${category}`);
}

export function getFaqItems(t: Translator): FaqItem[] {
  return FAQ_ITEM_IDS.map((id) => ({
    id,
    category: FAQ_ITEM_CATEGORIES[id],
    question: t(`faq.item.${id}.q`),
    answer: t(`faq.item.${id}.a`),
  }));
}

export function getFaqItemsForLanguage(language: AppLanguage): FaqItem[] {
  return getFaqItems((key, values) => translate(language, key, values));
}

export const CONTACT_TOPIC_IDS = [
  "general",
  "plans",
  "deposits_withdrawals",
  "account_security",
  "diligence",
  "other",
] as const;

export type ContactTopicId = (typeof CONTACT_TOPIC_IDS)[number];

export function getContactTopics(t: Translator): { id: ContactTopicId; label: string }[] {
  return CONTACT_TOPIC_IDS.map((id) => ({
    id,
    label: t(`contact.topic.${id}`),
  }));
}

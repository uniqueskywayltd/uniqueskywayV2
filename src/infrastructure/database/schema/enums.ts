import { pgEnum } from "drizzle-orm/pg-core";

export const accountStatusEnum = pgEnum("account_status", ["active", "restricted", "closed"]);
export const adminProfileStatusEnum = pgEnum("admin_profile_status", [
  "active",
  "suspended",
  "deactivated",
]);
export const auditActorTypeEnum = pgEnum("audit_actor_type", ["customer", "admin", "system"]);
export const backgroundJobStatusEnum = pgEnum("background_job_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
]);
export const depositStatusEnum = pgEnum("deposit_status", [
  "created",
  "pending",
  "confirmed",
  "failed",
  "cancelled",
  "reversed",
]);
export const emailStatusEnum = pgEnum("email_status", [
  "queued",
  "sending",
  "sent",
  "delivered",
  "bounced",
  "complained",
  "failed",
  "suppressed",
]);
export const featureFlagStatusEnum = pgEnum("feature_flag_status", [
  "disabled",
  "enabled",
  "archived",
]);
export const investmentPlanStatusEnum = pgEnum("investment_plan_status", [
  "draft",
  "active",
  "retired",
]);
export const investmentStatusEnum = pgEnum("investment_status", [
  "pending",
  "active",
  "maturing",
  "matured",
  "cancelled",
  "failed",
]);
export const kycStatusEnum = pgEnum("kyc_status", [
  "not_started",
  "pending",
  "approved",
  "rejected",
  "expired",
]);
export const ledgerAccountStatusEnum = pgEnum("ledger_account_status", ["active", "closed"]);
export const ledgerAccountTypeEnum = pgEnum("ledger_account_type", [
  "customer_pending_cash",
  "customer_available_cash",
  "customer_locked_principal",
  "customer_reserved_withdrawal",
  "customer_withdrawn_cash",
  "platform_cash",
  "platform_roi_expense",
  "platform_referral_expense",
  "platform_rounding",
  "provider_cash_clearing",
]);
export const ledgerDirectionEnum = pgEnum("ledger_direction", ["debit", "credit"]);
export const ledgerOwnerTypeEnum = pgEnum("ledger_owner_type", ["user", "platform", "provider"]);
export const ledgerTransactionTypeEnum = pgEnum("ledger_transaction_type", [
  "deposit_confirmation",
  "deposit_reversal",
  "investment_funding",
  "roi_settlement",
  "maturity_principal_release",
  "withdrawal_reservation",
  "withdrawal_payment",
  "withdrawal_release",
  "referral_reward",
  "ledger_correction",
]);
export const notificationChannelEnum = pgEnum("notification_channel", [
  "in_app",
  "email",
  "sms",
  "push",
]);
export const notificationDeliveryStatusEnum = pgEnum("notification_delivery_status", [
  "pending",
  "processing",
  "sent",
  "delivered",
  "failed",
  "suppressed",
]);
export const notificationPriorityEnum = pgEnum("notification_priority", [
  "info",
  "success",
  "warning",
  "critical",
]);
export const onboardingStatusEnum = pgEnum("onboarding_status", [
  "not_started",
  "in_progress",
  "submitted",
  "approved",
  "rejected",
]);
export const outboxStatusEnum = pgEnum("outbox_status", [
  "pending",
  "processing",
  "processed",
  "failed",
  "dead_lettered",
]);
export const paymentProviderEventStatusEnum = pgEnum("payment_provider_event_status", [
  "received",
  "processing",
  "processed",
  "failed",
  "ignored",
]);
export const planVersionStatusEnum = pgEnum("investment_plan_version_status", [
  "draft",
  "active",
  "retired",
]);
export const principalReturnPolicyEnum = pgEnum("principal_return_policy", [
  "return_at_maturity",
  "reinvest_at_maturity",
  "manual_review",
]);
export const earlyExitPolicyEnum = pgEnum("early_exit_policy", [
  "not_allowed",
  "admin_review",
  "allowed_with_penalty",
]);
export const referralCodeStatusEnum = pgEnum("referral_code_status", [
  "active",
  "paused",
  "retired",
]);
export const referralRewardStatusEnum = pgEnum("referral_reward_status", [
  "pending",
  "posted",
  "voided",
]);
export const referralStatusEnum = pgEnum("referral_status", [
  "pending",
  "qualified",
  "rewarded",
  "voided",
]);
export const riskStatusEnum = pgEnum("risk_status", ["not_reviewed", "clear", "watch", "blocked"]);
export const roiLedgerStatusEnum = pgEnum("roi_ledger_status", ["posted", "reversed"]);
export const roiScheduleStatusEnum = pgEnum("roi_schedule_status", [
  "scheduled",
  "posted",
  "skipped",
  "failed",
]);
export const securitySeverityEnum = pgEnum("security_severity", ["info", "warning", "critical"]);
export const sessionStatusEnum = pgEnum("session_status", ["active", "revoked", "expired"]);
export const settlementItemStatusEnum = pgEnum("settlement_item_status", [
  "posted",
  "skipped",
  "failed",
]);
export const settlementRunStatusEnum = pgEnum("settlement_run_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
]);
export const settlementRunTypeEnum = pgEnum("settlement_run_type", [
  "daily",
  "catch_up",
  "manual_replay",
]);
export const userStatusEnum = pgEnum("user_status", ["active", "restricted", "closed"]);
export const walletAccountCategoryEnum = pgEnum("wallet_account_category", [
  "pending",
  "available",
  "locked",
  "reserved",
  "withdrawn",
]);
export const walletStatusEnum = pgEnum("wallet_status", ["active", "restricted", "closed"]);
export const withdrawalStatusEnum = pgEnum("withdrawal_status", [
  "requested",
  "reserved",
  "under_review",
  "approved",
  "processing",
  "paid",
  "rejected",
  "failed",
  "cancelled",
]);

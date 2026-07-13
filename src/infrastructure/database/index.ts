export { createDatabaseConnection } from "./client";
export type { DatabaseConnection } from "./client";
export { getDatabaseConnection } from "./server";
export {
  CoreRepository,
  IdentityRepository,
  InvestmentRepository,
  LedgerRepository,
  NotificationRepository,
  OperationsRepository,
  PaymentRepository,
  ReferralRepository,
  SettlementRepository,
} from "./repositories";
export { DrizzleTransactionManager } from "./transactions";
export * as schema from "./schema";
export type { DrizzleTransactionContext } from "./transactions";
export type { AppDatabase, AppDatabaseExecutor, AppTransaction } from "./types";
export type {
  AdminProfileRecord,
  AuditLogRecord,
  CustomerAccountRecord,
  CustomerNoteRecord,
  CustomerPreferenceRecord,
  CustomerProfileRecord,
  CustomerSearchRow,
  DepositIntentRecord,
  EmailMessageRecord,
  InvestmentRecord,
  LedgerAccountRecord,
  LedgerPostingInput,
  LedgerTransactionRecord,
  PaymentProviderEventRecord,
  RoiLedgerEntryRecord,
  RoiScheduleItemRecord,
  RoleRecord,
  SearchCustomersQuery,
  SearchCustomersResult,
  SecurityEventRecord,
  SettlementItemRecord,
  SettlementRunRecord,
  UserRecord,
  WalletBalanceRecord,
  WalletRecord,
  WithdrawalRequestRecord,
} from "./repositories";

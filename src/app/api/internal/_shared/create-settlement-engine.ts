import { InvestmentEngineService } from "@/application/investments/investment-engine-service";
import {
  CoreRepository,
  DrizzleTransactionManager,
  IdentityRepository,
  InvestmentRepository,
  LedgerRepository,
  NotificationRepository,
  ReferralRepository,
  SettlementRepository,
  getDatabaseConnection,
} from "@/infrastructure/database";
import { systemClock } from "@/infrastructure/time/system-clock";

export function createSettlementEngineService() {
  const { db } = getDatabaseConnection();
  return new InvestmentEngineService({
    clock: systemClock,
    transactionManager: new DrizzleTransactionManager(db),
    coreRepository: new CoreRepository(db),
    investmentRepository: new InvestmentRepository(db),
    ledgerRepository: new LedgerRepository(db),
    settlementRepository: new SettlementRepository(db),
    notificationRepository: new NotificationRepository(db),
    identityRepository: new IdentityRepository(db),
    referralRepository: new ReferralRepository(db),
  });
}

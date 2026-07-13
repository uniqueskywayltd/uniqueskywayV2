import "server-only";

import { AppError } from "@/application/errors";
import type { IdentityProvider } from "@/application/auth";
import type {
  IdentityRepository,
  ReferralRepository,
} from "@/infrastructure/database";

export interface CustomerReferralServiceDependencies {
  identityProvider: IdentityProvider;
  identityRepository: IdentityRepository;
  referralRepository: ReferralRepository;
}

export class CustomerReferralService {
  constructor(private readonly deps: CustomerReferralServiceDependencies) {}

  async getReferralSummary() {
    const appUser = await this.requireCurrentAppUser();
    const [code, codes, referrals, rewards] = await Promise.all([
      this.deps.referralRepository.findDefaultReferralCodeByUserId(appUser.id),
      this.deps.referralRepository.listReferralCodesByUserId(appUser.id, 5),
      this.deps.referralRepository.listReferralsByReferrerUserId(appUser.id, 50),
      this.deps.referralRepository.listRewardsForReferrer(appUser.id, 50),
    ]);

    const postedRewards = rewards.filter((reward) => reward.status === "posted");
    const pendingRewards = rewards.filter((reward) => reward.status === "pending");
    const postedAmountMinor = postedRewards.reduce(
      (sum, reward) => sum + reward.amountMinor,
      0n,
    );

    return {
      code: code
        ? {
            id: code.id,
            code: code.code,
            status: code.status,
            isDefault: code.isDefault,
            createdAt: code.createdAt.toISOString(),
          }
        : null,
      codes: codes.map((item) => ({
        id: item.id,
        code: item.code,
        status: item.status,
        isDefault: item.isDefault,
        createdAt: item.createdAt.toISOString(),
      })),
      summary: {
        referralCount: referrals.length,
        qualifiedCount: referrals.filter((item) => item.status === "qualified").length,
        pendingCount: referrals.filter((item) => item.status === "pending").length,
        postedRewardCount: postedRewards.length,
        pendingRewardCount: pendingRewards.length,
        postedRewardAmountMinor: postedAmountMinor.toString(),
      },
      referrals: referrals.slice(0, 20).map((item) => ({
        id: item.id,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        qualifiedAt: item.qualifiedAt?.toISOString() ?? null,
      })),
      rewards: rewards.slice(0, 20).map((item) => ({
        id: item.id,
        currency: item.currency,
        amountMinor: item.amountMinor.toString(),
        status: item.status,
        postedAt: item.postedAt?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }

  private async requireCurrentAppUser() {
    const currentUser = await this.deps.identityProvider.getCurrentUser();

    if (!currentUser) {
      throw new AppError({ code: "AUTHENTICATION_ERROR", message: "Authentication is required." });
    }

    const appUser = await this.deps.identityRepository.findUserByAuthUserId(currentUser.authUserId);

    if (!appUser) {
      throw new AppError({
        code: "AUTHENTICATION_ERROR",
        message: "Authenticated user is not registered.",
      });
    }

    return appUser;
  }
}

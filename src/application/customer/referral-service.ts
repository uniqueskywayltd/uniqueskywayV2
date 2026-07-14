import "server-only";

import { AppError } from "@/application/errors";
import type { IdentityProvider } from "@/application/auth";
import { getServerEnv } from "@/config/server-env";
import type {
  IdentityRepository,
  ReferralRepository,
} from "@/infrastructure/database";

export interface CustomerReferralServiceDependencies {
  identityProvider: IdentityProvider;
  identityRepository: IdentityRepository;
  referralRepository: ReferralRepository;
}

const SHARE_DISCLAIMER =
  "This is an invitation, not financial advice. Returns are never guaranteed.";

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

    const shareUrl = code
      ? buildReferralShareUrl(getServerEnv().NEXT_PUBLIC_APP_URL, code.code)
      : null;
    const shareText = code
      ? `I'm inviting you to Unique Sky Way — a calm investment platform. Use invitation code ${code.code} when you register. ${SHARE_DISCLAIMER}`
      : null;

    return {
      northStar: "How do I recommend this platform responsibly?",
      understanding:
        "Referrals are invitations to a trusted service — not pressure, spam, or an affiliate race. Rewards post only through the certified ledger.",
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
      share: {
        url: shareUrl,
        text: shareText,
        disclaimer: SHARE_DISCLAIMER,
      },
      guidance: REFERRAL_GUIDANCE,
      summary: {
        referralCount: referrals.length,
        qualifiedCount: referrals.filter((item) => item.status === "qualified").length,
        pendingCount: referrals.filter((item) => item.status === "pending").length,
        rewardedCount: referrals.filter((item) => item.status === "rewarded").length,
        postedRewardCount: postedRewards.length,
        pendingRewardCount: pendingRewards.length,
        postedRewardAmountMinor: postedAmountMinor.toString(),
      },
      referrals: referrals.slice(0, 40).map((item) => ({
        id: item.id,
        status: item.status,
        statusLabel: presentReferralStatus(item.status),
        createdAt: item.createdAt.toISOString(),
        qualifiedAt: item.qualifiedAt?.toISOString() ?? null,
      })),
      rewards: rewards.slice(0, 40).map((item) => ({
        id: item.id,
        currency: item.currency,
        amountMinor: item.amountMinor.toString(),
        status: item.status,
        statusLabel: presentRewardStatus(item.status),
        postedAt: item.postedAt?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
        ledgerHint:
          item.status === "posted"
            ? "Credited to your ledger — not a points balance."
            : "Pending until eligibility posts through the certified engine.",
      })),
      links: {
        learnHref: "/account/learn/referrals-responsible",
        helpHref: "/account/help",
        ledgerHref: "/ledger",
        successHref: "/account/success",
      },
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

export function buildReferralShareUrl(appUrl: string, code: string): string {
  const base = new URL(appUrl);
  base.pathname = "/auth/register";
  base.search = "";
  base.searchParams.set("referral", code);
  return base.toString();
}

export function presentReferralStatus(status: string): string {
  const labels: Record<string, string> = {
    pending: "Registered",
    qualified: "Qualified",
    rewarded: "Rewarded",
    voided: "Not eligible",
  };
  return labels[status] ?? status;
}

export function presentRewardStatus(status: string): string {
  const labels: Record<string, string> = {
    pending: "Reward pending",
    posted: "Reward credited",
    voided: "Not eligible",
  };
  return labels[status] ?? status;
}

export const REFERRAL_GUIDANCE = [
  {
    id: "how-it-works",
    title: "How referrals work",
    body: "Share your personal invitation link or code. Friends apply it at registration. Eligibility and rewards follow platform policy — never invented UI math.",
  },
  {
    id: "eligibility",
    title: "Eligibility",
    body: "Statuses move from registered to qualified to rewarded only when certified rules are met. Pending means waiting — not a promise of a clock time.",
  },
  {
    id: "privacy",
    title: "Privacy",
    body: "You will not see other people’s balances, investments, or contact details. History shows only high-level status you are allowed to know.",
  },
  {
    id: "good-practices",
    title: "Good practices",
    body: "Invite people who asked or would welcome a calm recommendation. Do not spam lists, invent returns, or pressure anyone. Rewards acknowledge successful participation — not aggressive promotion.",
  },
] as const;

import type { EntityId, IsoDateTimeString, NewYorkDateString } from "@/domains/shared";
import type { UserId } from "@/domains/identity";

export type CustomerProfileId = EntityId<"CustomerProfile">;
export type CustomerAccountId = EntityId<"CustomerAccount">;

export type OnboardingStatus =
  "not_started" | "in_progress" | "submitted" | "approved" | "rejected";
export type KycStatus = "not_started" | "pending" | "approved" | "rejected" | "expired";
export type RiskStatus = "not_reviewed" | "clear" | "watch" | "blocked";
export type AccountStatus = "active" | "restricted" | "closed";

export interface CustomerProfile {
  id: CustomerProfileId;
  userId: UserId;
  legalName: string | null;
  displayName: string | null;
  phone: string | null;
  country: string | null;
  stateRegion: string | null;
  dateOfBirth: NewYorkDateString | null;
  onboardingStatus: OnboardingStatus;
  kycStatus: KycStatus;
  riskStatus: RiskStatus;
  termsAcceptedAt: IsoDateTimeString | null;
  termsVersion: string | null;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

export interface CustomerAccount {
  id: CustomerAccountId;
  userId: UserId;
  accountNumber: string;
  status: AccountStatus;
  restrictionReason: string | null;
  openedAt: IsoDateTimeString;
  closedAt: IsoDateTimeString | null;
  createdAt: IsoDateTimeString;
  updatedAt: IsoDateTimeString;
}

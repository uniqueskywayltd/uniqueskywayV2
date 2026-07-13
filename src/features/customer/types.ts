export interface CustomerSummary {
  user: {
    id: string;
    email: string;
    emailVerifiedAt: string | Date | null;
    status: string;
  };
  profile: CustomerProfile | null;
  account: CustomerAccount | null;
  preferences: CustomerPreferences;
  notificationPreferences: NotificationPreferenceSummary;
  unreadNotificationCount: number;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  legalName: string | null;
  displayName: string | null;
  phone: string | null;
  country: string | null;
  stateRegion: string | null;
  dateOfBirth: string | null;
  avatarStoragePath: string | null;
  avatarContentType: string | null;
  avatarUpdatedAt: string | Date | null;
  onboardingStatus: string;
  kycStatus: string;
  riskStatus: string;
  avatarUrl?: string | null;
}

export interface CustomerAccount {
  id: string;
  accountNumber: string;
  status: string;
  restrictionReason: string | null;
  openedAt: string | Date;
}

export interface CustomerPreferences {
  id: string | null;
  userId: string;
  appearance: "system" | "light" | "dark";
  language: string;
  timeZone: string;
  inAppNotificationsEnabled: boolean;
  securityEmailsEnabled: boolean;
  productEmailsEnabled: boolean;
  marketingEmailsEnabled: boolean;
}

export interface NotificationPreferenceSummary {
  inApp: Record<string, boolean>;
  email: {
    security: boolean;
    product: boolean;
    marketing: boolean;
  };
}

export interface CustomerNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  priority: string;
  category?: "financial" | "security" | "system";
  href?: string | null;
  data?: Record<string, unknown>;
  readAt: string | Date | null;
  createdAt: string | Date;
  isToday?: boolean;
}

export interface CustomerActivity {
  id: string;
  type: string;
  category?: "financial" | "security" | "account";
  title: string;
  detail: string;
  createdAt: string | Date;
}

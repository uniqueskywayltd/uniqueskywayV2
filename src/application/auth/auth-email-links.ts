import "server-only";

import { AUTH_ROUTES } from "@/application/auth/constants";
import { displayOtp, normalizeOtpToken } from "@/application/auth/otp";
import { resolvePublicAppUrl } from "@/config/public-app-url";

export type AuthEmailFlow = "signup" | "email" | "magiclink" | "recovery";

type GenerateLinkProperties = {
  actionLink?: string;
  action_link?: string;
  hashedToken?: string;
  hashed_token?: string;
  emailOtp?: string;
  email_otp?: string;
};

/**
 * Branded on-domain auth link for transactional emails.
 * Prefer this over raw Supabase /auth/v1/verify URLs (better deliverability + UX).
 */
export function buildAppAuthActionUrl(params: {
  tokenHash: string;
  flow: AuthEmailFlow;
  email: string;
  appUrl?: string;
}): string {
  const base = params.appUrl ?? resolvePublicAppUrl();
  const path = params.flow === "recovery" ? AUTH_ROUTES.resetPassword : AUTH_ROUTES.verifyEmail;
  const url = new URL(`${base}${path}`);
  url.searchParams.set("token_hash", params.tokenHash);
  url.searchParams.set("type", params.flow === "recovery" ? "recovery" : params.flow);
  url.searchParams.set("email", params.email.toLowerCase());
  return url.toString();
}

export function extractTokenHashFromActionLink(actionLink?: string | null): string | null {
  if (!actionLink) return null;
  try {
    return new URL(actionLink).searchParams.get("token");
  } catch {
    return null;
  }
}

export function buildAuthEmailAction(params: {
  properties: GenerateLinkProperties;
  flow: AuthEmailFlow;
  email: string;
  appUrl?: string;
}): { actionLink: string; otp: string | null; hashedToken: string } {
  const hashedToken =
    params.properties.hashedToken ??
    params.properties.hashed_token ??
    extractTokenHashFromActionLink(params.properties.actionLink ?? params.properties.action_link);

  if (!hashedToken) {
    throw new Error("Verification token missing from auth link");
  }

  const rawOtp = params.properties.emailOtp ?? params.properties.email_otp ?? null;
  const otp = displayOtp(rawOtp ? normalizeOtpToken(rawOtp) : null);

  return {
    hashedToken,
    otp,
    actionLink: buildAppAuthActionUrl({
      tokenHash: hashedToken,
      flow: params.flow,
      email: params.email,
      ...(params.appUrl ? { appUrl: params.appUrl } : {}),
    }),
  };
}

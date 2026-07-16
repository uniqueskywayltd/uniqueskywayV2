import "server-only";

import { createHash } from "node:crypto";

import { and, desc, eq, inArray, isNull } from "drizzle-orm";

import { extractFirstName, formatLocation } from "@/application/public/social-proof-privacy";
import { formatMoneyMinorUnits } from "@/i18n/format";
import { getDatabaseConnection, schema } from "@/infrastructure/database";

const { adminProfiles, customerProfiles, investments, users, withdrawalRequests } = schema;

export { extractFirstName, formatLocation } from "@/application/public/social-proof-privacy";

export type SocialProofEventType = "registration" | "investment" | "withdrawal";

export type SocialProofEvent = {
  /** Opaque synthetic id — not a database primary key. */
  id: string;
  type: SocialProofEventType;
  firstName: string;
  location: string;
  amountLabel: string | null;
  occurredAt: string;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_LIMIT = 40;

let memoryCache: { expiresAt: number; events: SocialProofEvent[] } | null = null;

export async function getSocialProofEvents(): Promise<SocialProofEvent[]> {
  const now = Date.now();
  if (memoryCache && memoryCache.expiresAt > now) {
    return memoryCache.events;
  }

  const events = await loadSocialProofEventsFromDatabase();
  memoryCache = { expiresAt: now + CACHE_TTL_MS, events };
  return events;
}

async function loadSocialProofEventsFromDatabase(): Promise<SocialProofEvent[]> {
  const { db } = getDatabaseConnection();

  const [registrationRows, investmentRows, withdrawalRows] = await Promise.all([
    db
      .select({
        userId: users.id,
        createdAt: users.createdAt,
        legalName: customerProfiles.legalName,
        displayName: customerProfiles.displayName,
        country: customerProfiles.country,
        stateRegion: customerProfiles.stateRegion,
      })
      .from(users)
      .innerJoin(customerProfiles, eq(customerProfiles.userId, users.id))
      .leftJoin(adminProfiles, eq(adminProfiles.userId, users.id))
      .where(and(eq(users.status, "active"), isNull(adminProfiles.id)))
      .orderBy(desc(users.createdAt))
      .limit(FETCH_LIMIT),
    db
      .select({
        investmentId: investments.id,
        principalMinor: investments.principalMinor,
        currency: investments.currency,
        activatedAt: investments.activatedAt,
        userId: investments.userId,
      })
      .from(investments)
      .leftJoin(adminProfiles, eq(adminProfiles.userId, investments.userId))
      .where(
        and(
          inArray(investments.status, ["active", "maturing", "matured"]),
          isNull(adminProfiles.id),
        ),
      )
      .orderBy(desc(investments.activatedAt))
      .limit(FETCH_LIMIT),
    db
      .select({
        withdrawalId: withdrawalRequests.id,
        amountMinor: withdrawalRequests.amountMinor,
        currency: withdrawalRequests.currency,
        paidAt: withdrawalRequests.paidAt,
        userId: withdrawalRequests.userId,
      })
      .from(withdrawalRequests)
      .leftJoin(adminProfiles, eq(adminProfiles.userId, withdrawalRequests.userId))
      .where(and(eq(withdrawalRequests.status, "paid"), isNull(adminProfiles.id)))
      .orderBy(desc(withdrawalRequests.paidAt))
      .limit(FETCH_LIMIT),
  ]);

  const profileUserIds = [
    ...new Set([
      ...investmentRows.map((row) => row.userId),
      ...withdrawalRows.map((row) => row.userId),
    ]),
  ];

  const profileByUserId = new Map<
    string,
    {
      legalName: string | null;
      displayName: string | null;
      country: string | null;
      stateRegion: string | null;
    }
  >();

  if (profileUserIds.length > 0) {
    const profiles = await db
      .select({
        userId: customerProfiles.userId,
        legalName: customerProfiles.legalName,
        displayName: customerProfiles.displayName,
        country: customerProfiles.country,
        stateRegion: customerProfiles.stateRegion,
      })
      .from(customerProfiles)
      .where(inArray(customerProfiles.userId, profileUserIds));

    for (const profile of profiles) {
      profileByUserId.set(profile.userId, profile);
    }
  }

  const events: SocialProofEvent[] = [];

  for (const row of registrationRows) {
    const firstName = extractFirstName(row.legalName, row.displayName);
    const location = formatLocation(row.stateRegion, row.country);
    if (!firstName || !location) continue;
    events.push({
      id: opaqueId("registration", row.userId, row.createdAt),
      type: "registration",
      firstName,
      location,
      amountLabel: null,
      occurredAt: row.createdAt.toISOString(),
    });
  }

  for (const row of investmentRows) {
    if (!row.activatedAt) continue;
    const profile = profileByUserId.get(row.userId);
    const firstName = extractFirstName(profile?.legalName ?? null, profile?.displayName ?? null);
    const location = formatLocation(profile?.stateRegion ?? null, profile?.country ?? null);
    if (!firstName || !location) continue;
    events.push({
      id: opaqueId("investment", row.investmentId, row.activatedAt),
      type: "investment",
      firstName,
      location,
      amountLabel: formatMoneyMinorUnits("en", Number(row.principalMinor), row.currency, 0),
      occurredAt: row.activatedAt.toISOString(),
    });
  }

  for (const row of withdrawalRows) {
    if (!row.paidAt) continue;
    const profile = profileByUserId.get(row.userId);
    const firstName = extractFirstName(profile?.legalName ?? null, profile?.displayName ?? null);
    const location = formatLocation(profile?.stateRegion ?? null, profile?.country ?? null);
    if (!firstName || !location) continue;
    events.push({
      id: opaqueId("withdrawal", row.withdrawalId, row.paidAt),
      type: "withdrawal",
      firstName,
      location,
      amountLabel: formatMoneyMinorUnits("en", Number(row.amountMinor), row.currency, 0),
      occurredAt: row.paidAt.toISOString(),
    });
  }

  events.sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
  return events.slice(0, 60);
}

function opaqueId(type: string, sourceId: string, at: Date): string {
  return createHash("sha256")
    .update(`${type}:${sourceId}:${at.toISOString()}`)
    .digest("hex")
    .slice(0, 24);
}

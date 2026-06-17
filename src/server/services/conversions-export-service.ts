import { prisma } from "@/server/db/client";
import { getEnv } from "@/server/env";
import { getSponsorSlotConfig } from "@/server/services/sponsor-pricing";

/**
 * Read-only export of paid conversions for the outreach analytics app, which
 * lives on a SEPARATE database and pulls this feed hourly to attribute sales
 * back to cold-email contacts. This endpoint never mutates anything.
 *
 * Revenue is reconstructed exactly from the same pricing rules the app charges
 * with — no stored amount needed:
 *   - Premium Launch: the first FOUNDING_PREMIUM_LAUNCH_LIMIT paid launches were
 *     the $9 founding price, every one after is $19 (Early Access). Ordering by
 *     paidAt and indexing reproduces what Dodo actually charged.
 *   - Ads (sponsor placements): the slot's configured price.
 */

export type ConversionType = "PREMIUM_LAUNCH" | "AD";

export type ConversionRecord = {
  sourceId: string;
  type: ConversionType;
  websiteUrl: string;
  productName: string;
  founderEmail: string | null;
  paidAt: string;
  amountCents: number;
  currency: string;
};

const FOUNDING_PRICE_CENTS = 900;
const EARLY_ACCESS_PRICE_CENTS = 1900;

export async function listPaidConversions(
  since?: Date,
): Promise<ConversionRecord[]> {
  const env = getEnv();

  // Rank ALL paid premium launches by paidAt so we can apply the founding →
  // early-access price boundary, then filter to the requested window after.
  const paidPremium = await prisma.submission.findMany({
    where: {
      submissionType: "FEATURED_LAUNCH",
      paymentStatus: "PAID",
      paidAt: { not: null },
    },
    orderBy: { paidAt: "asc" },
    select: {
      id: true,
      paidAt: true,
      tool: { select: { name: true, websiteUrl: true } },
      user: { select: { email: true } },
    },
  });

  const premiumRecords: ConversionRecord[] = paidPremium.map(
    (submission, index) => ({
      sourceId: submission.id,
      type: "PREMIUM_LAUNCH" as const,
      websiteUrl: submission.tool.websiteUrl,
      productName: submission.tool.name,
      founderEmail: submission.user.email,
      paidAt: submission.paidAt!.toISOString(),
      amountCents:
        index < env.FOUNDING_PREMIUM_LAUNCH_LIMIT
          ? FOUNDING_PRICE_CENTS
          : EARLY_ACCESS_PRICE_CENTS,
      currency: "USD",
    }),
  );

  // Ad pricing is per-slot and independent of rank, so (unlike premium launches)
  // the `since` window can be pushed into the query instead of filtered in memory.
  const paidAds = await prisma.sponsorPlacement.findMany({
    where: { paidAt: since ? { not: null, gt: since } : { not: null } },
    orderBy: { paidAt: "asc" },
    select: {
      id: true,
      slot: true,
      paidAt: true,
      tool: {
        select: { name: true, websiteUrl: true, owner: { select: { email: true } } },
      },
    },
  });

  const adRecords: ConversionRecord[] = paidAds.map((placement) => ({
    sourceId: placement.id,
    type: "AD" as const,
    websiteUrl: placement.tool.websiteUrl,
    productName: placement.tool.name,
    founderEmail: placement.tool.owner?.email ?? null,
    paidAt: placement.paidAt!.toISOString(),
    amountCents: getSponsorSlotConfig(placement.slot).priceUsd * 100,
    currency: "USD",
  }));

  // Premium launches were fetched in full (for the founding-price boundary), so
  // their `since` window is applied here; ads were already windowed in the query.
  const premiumFiltered = since
    ? premiumRecords.filter(
        (record) => new Date(record.paidAt).getTime() > since.getTime(),
      )
    : premiumRecords;

  const all = [...premiumFiltered, ...adRecords];

  return all.sort(
    (a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime(),
  );
}

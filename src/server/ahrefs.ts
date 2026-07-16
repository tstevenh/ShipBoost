import "server-only";

import { unstable_cache } from "next/cache";

import { siteDomainRating } from "@/content/site-domain-rating";
import { getEnv } from "@/server/env";

const SITE_DOMAIN = "shipboost.io";
const ONE_DAY_SECONDS = 86_400;

// Domain Rating by Ahrefs — attribution required by the DR license.
// https://ahrefs.com/legal/domain-rating-license
async function fetchDomainRating(domain: string): Promise<number | null> {
  const token = getEnv().AHREFS_API_TOKEN;
  const url = `https://api.ahrefs.com/v3/public/domain-rating-free?target=${encodeURIComponent(
    domain,
  )}&output=json`;

  try {
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      // Let unstable_cache own the caching window; don't double-cache here.
      cache: "no-store",
    });
    if (!response.ok) return null;

    const json = (await response.json()) as {
      domain_rating?: { domain_rating?: number };
    };
    const dr = json.domain_rating?.domain_rating;
    return typeof dr === "number" ? Math.round(dr) : null;
  } catch {
    return null;
  }
}

/**
 * shipboost.io's Domain Rating, refreshed at most once per day via ISR.
 * Falls back to the last committed value in site-domain-rating.ts if the
 * Ahrefs call fails or no token is configured, so the badge never breaks.
 */
export const getCachedSiteDomainRating = unstable_cache(
  async (): Promise<number> => {
    const live = await fetchDomainRating(SITE_DOMAIN);
    return live ?? siteDomainRating.value;
  },
  ["site-domain-rating", "v1"],
  { revalidate: ONE_DAY_SECONDS, tags: ["site-domain-rating"] },
);

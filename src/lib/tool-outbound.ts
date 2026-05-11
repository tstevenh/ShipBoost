export type ToolOutboundTarget = "website" | "affiliate";
export type ToolOutboundSource =
  | "tool_page"
  | "tool_page_related"
  | "launch_board"
  | "category_page"
  | "category_featured"
  | "best_tag_page"
  | "alternatives_page"
  | "sponsor_slot";

export function buildTrackedToolOutboundUrl(
  toolId: string,
  target: ToolOutboundTarget,
  source: ToolOutboundSource,
) {
  const searchParams = new URLSearchParams({
    target,
    source,
  });

  return `/api/outbound/tool/${toolId}?${searchParams.toString()}`;
}

const SHIPBOOST_UTM_SOURCE = "shipboost";
const SHIPBOOST_UTM_MEDIUM = "referral";

/**
 * Build a direct outbound URL with ShipBoost UTM params baked in.
 * Picks the affiliate URL when available, otherwise the website URL.
 * Falls back to the original href when the URL can't be parsed (e.g. weird schemes).
 */
export function buildToolOutboundHref(input: {
  websiteUrl: string | null | undefined;
  affiliateUrl?: string | null;
  source: ToolOutboundSource;
  toolSlug: string;
}): string | null {
  const rawHref = input.affiliateUrl?.trim() || input.websiteUrl?.trim() || null;

  if (!rawHref) {
    return null;
  }

  try {
    const url = new URL(rawHref);
    url.searchParams.set("utm_source", SHIPBOOST_UTM_SOURCE);
    url.searchParams.set("utm_medium", SHIPBOOST_UTM_MEDIUM);
    url.searchParams.set("utm_campaign", input.source);
    url.searchParams.set("utm_content", input.toolSlug);
    return url.toString();
  } catch {
    return rawHref;
  }
}

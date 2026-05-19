export type OutboundLinkSurface =
  | "startup_directories"
  | "pricing_page"
  | "blog_author_card"
  | "blog_content"
  | "about_page"
  | "footer"
  | "frogdr_badge"
  | "public_page"
  | "tool_page"
  | "tool_listing"
  | "tool_page_related"
  | "launch_board"
  | "category_page"
  | "category_featured"
  | "best_tag_page"
  | "alternatives_page"
  | "sponsor_slot";

export type OutboundLinkContext =
  | "startup_directories"
  | "pricing"
  | "blog"
  | "about"
  | "footer"
  | "public_page"
  | "tool_page"
  | "tool_listing"
  | "inline_banner"
  | "inline_product";

export type SponsorAdSlot = "SIDEBAR" | "INLINE_BANNER" | "INLINE_PRODUCT";

type IsTrackableInput = {
  href: string;
  siteOrigin: string;
};

export type OutboundLinkClickedPropertiesInput = {
  href: string;
  sourcePath: string;
  sourceSurface: OutboundLinkSurface;
  linkContext: OutboundLinkContext;
  linkText?: string;
  trackingMethod: "browser";
  isToolLink: boolean;
  toolId?: string;
  toolSlug?: string;
  toolName?: string;
  sponsorSlot?: SponsorAdSlot;
};

export type ToolWebsiteRelPolicyInput = {
  badgeVerification?: "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "FAILED" | null;
  currentLaunchType?: "FREE" | "FEATURED" | "RELAUNCH" | null;
  isFeatured?: boolean | null;
};

export function resolveToolWebsiteRel(input: ToolWebsiteRelPolicyInput) {
  if (input.isFeatured || input.currentLaunchType === "FEATURED") {
    return "noopener";
  }

  if (input.badgeVerification === "VERIFIED") {
    return "noopener";
  }

  return "nofollow noopener";
}

export function isTrackableOutboundHttpUrl({
  href,
  siteOrigin,
}: IsTrackableInput) {
  try {
    const resolvedUrl = new URL(href, siteOrigin);
    const currentSiteUrl = new URL(siteOrigin);

    if (!["http:", "https:"].includes(resolvedUrl.protocol)) {
      return false;
    }

    return resolvedUrl.origin !== currentSiteUrl.origin;
  } catch {
    return false;
  }
}

const SHIPBOOST_UTM_SOURCE = "shipboost";
const SHIPBOOST_UTM_MEDIUM = "referral";

/**
 * Generic UTM injector for any outbound href.
 * - Leaves same-origin / mailto / tel / hash / unparsable URLs untouched
 * - Does NOT override pre-existing utm_* params (e.g. affiliate links that already carry tracking)
 *
 * Use directly when you control the href server-side. The TrackedExternalLink
 * component and the markdown renderer call this automatically.
 */
export function withShipboostUtm(
  href: string | undefined | null,
  options: {
    surface: OutboundLinkSurface | string;
    content?: string | null;
    siteOrigin?: string;
  },
): string {
  if (!href) return "";
  // Skip non-http(s), same-origin, or unparsable
  if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return href;
  }

  try {
    const url = new URL(href);
    if (!["http:", "https:"].includes(url.protocol)) return href;

    // Respect URLs that already carry utm_* — don't overwrite the founder's own / affiliate's tracking
    const alreadyTagged = ["utm_source", "utm_medium", "utm_campaign"].some(
      (key) => url.searchParams.has(key),
    );
    if (alreadyTagged) return url.toString();

    url.searchParams.set("utm_source", SHIPBOOST_UTM_SOURCE);
    url.searchParams.set("utm_medium", SHIPBOOST_UTM_MEDIUM);
    url.searchParams.set("utm_campaign", options.surface);
    if (options.content) {
      url.searchParams.set("utm_content", options.content);
    }
    return url.toString();
  } catch {
    return href;
  }
}

export function buildOutboundLinkClickedProperties(
  input: OutboundLinkClickedPropertiesInput,
) {
  const destinationUrl = new URL(input.href);

  return {
    href: destinationUrl.toString(),
    destination_domain: destinationUrl.hostname,
    source_path: input.sourcePath,
    source_surface: input.sourceSurface,
    link_context: input.linkContext,
    link_text: input.linkText ?? null,
    tracking_method: input.trackingMethod,
    is_tool_link: input.isToolLink,
    tool_id: input.toolId ?? null,
    tool_slug: input.toolSlug ?? null,
    tool_name: input.toolName ?? null,
    sponsor_slot: input.sponsorSlot ?? null,
  };
}

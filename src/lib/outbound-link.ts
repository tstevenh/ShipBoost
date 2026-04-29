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
  | "alternatives_page";

export type OutboundLinkContext =
  | "startup_directories"
  | "pricing"
  | "blog"
  | "about"
  | "footer"
  | "public_page"
  | "tool_page"
  | "tool_listing";

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
  trackingMethod: "browser" | "server_redirect";
  isToolLink: boolean;
  toolId?: string;
  toolSlug?: string;
  toolName?: string;
};

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
  };
}

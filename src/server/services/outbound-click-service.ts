import { getSessionFromRequest } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { AppError } from "@/server/http/app-error";
import { buildOutboundLinkClickedProperties } from "@/lib/outbound-link";
import { capturePostHogEvent } from "@/server/posthog";
import { getPubliclyVisibleToolWhere } from "@/server/services/public-tool-visibility";
import type { ToolOutboundSource, ToolOutboundTarget } from "@/lib/tool-outbound";

const SHIPBOOST_UTM_SOURCE = "shipboost";
const SHIPBOOST_UTM_MEDIUM = "referral";

function getAnonymousDistinctId() {
  return `anon:${crypto.randomUUID()}`;
}

function getSourcePath(referer: string | null) {
  if (!referer) {
    return null;
  }

  try {
    const url = new URL(referer);
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

function resolveTargetUrl(
  tool: {
    websiteUrl: string;
    affiliateUrl: string | null;
  },
  target: ToolOutboundTarget,
) {
  if (target === "website") {
    if (tool.affiliateUrl) {
      return {
        url: tool.affiliateUrl,
        usedAffiliateUrl: true,
      };
    }

    return {
      url: tool.websiteUrl,
      usedAffiliateUrl: false,
    };
  }

  if (!tool.affiliateUrl) {
    throw new AppError(404, "Affiliate link not found.");
  }

  return {
    url: tool.affiliateUrl,
    usedAffiliateUrl: true,
  };
}

function buildTrackedDestinationUrl(input: {
  destinationUrl: string;
  source: ToolOutboundSource;
  toolSlug: string;
  appendUtm: boolean;
}) {
  let url: URL;

  try {
    url = new URL(input.destinationUrl);
  } catch {
    throw new AppError(500, "Tool destination URL is invalid.");
  }

  if (!input.appendUtm) {
    return url.toString();
  }

  url.searchParams.set("utm_source", SHIPBOOST_UTM_SOURCE);
  url.searchParams.set("utm_medium", SHIPBOOST_UTM_MEDIUM);
  url.searchParams.set("utm_campaign", input.source);
  url.searchParams.set("utm_content", input.toolSlug);

  return url.toString();
}

function getDestinationDomain(destinationUrl: string) {
  try {
    return new URL(destinationUrl).hostname;
  } catch {
    return null;
  }
}

function getToolLinkContext(source: ToolOutboundSource) {
  return source === "tool_page" ? "tool_page" : "tool_listing";
}

export async function resolveTrackedToolOutboundClick(input: {
  toolId: string;
  target: ToolOutboundTarget;
  source: ToolOutboundSource;
  referer: string | null;
  request: Request;
}) {
  const tool = await prisma.tool.findFirst({
    where: {
      id: input.toolId,
      ...getPubliclyVisibleToolWhere(),
    },
    select: {
      id: true,
      slug: true,
      name: true,
      websiteUrl: true,
      affiliateUrl: true,
      isFeatured: true,
      currentLaunchType: true,
    },
  });

  if (!tool) {
    throw new AppError(404, "Tool not found.");
  }

  const resolvedTarget = resolveTargetUrl(tool, input.target);
  const destinationUrl = buildTrackedDestinationUrl({
    destinationUrl: resolvedTarget.url,
    source: input.source,
    toolSlug: tool.slug,
    appendUtm: !resolvedTarget.usedAffiliateUrl,
  });
  const session = await getSessionFromRequest(input.request as never);
  const distinctId = session?.user.id ?? getAnonymousDistinctId();
  const sourcePath = getSourcePath(input.referer);

  try {
    await capturePostHogEvent({
      distinctId,
      event: "outbound_link_clicked",
      properties: buildOutboundLinkClickedProperties({
        href: destinationUrl,
        sourcePath: sourcePath ?? "/unknown",
        sourceSurface: input.source,
        linkContext: getToolLinkContext(input.source),
        linkText: tool.name,
        trackingMethod: "server_redirect",
        isToolLink: true,
        toolId: tool.id,
        toolSlug: tool.slug,
        toolName: tool.name,
      }),
    });

    await capturePostHogEvent({
      distinctId,
      event: "tool_outbound_click",
      properties: {
        tool_id: tool.id,
        tool_slug: tool.slug,
        tool_name: tool.name,
        destination_type: input.target,
        destination_url: destinationUrl,
        destination_url_original: resolvedTarget.url,
        destination_url_final: destinationUrl,
        destination_domain: getDestinationDomain(resolvedTarget.url),
        source_surface: input.source,
        source_path: sourcePath,
        used_affiliate_url: resolvedTarget.usedAffiliateUrl,
        is_featured: tool.isFeatured,
        current_launch_type: tool.currentLaunchType,
      },
    });
  } catch (error) {
    console.error("[shipboost outbound-click:capture-error]", error);
  }

  return {
    destinationUrl,
  };
}

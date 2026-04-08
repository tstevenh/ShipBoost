import { getSessionFromRequest } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { AppError } from "@/server/http/app-error";
import { capturePostHogEvent } from "@/server/posthog";
import { getPubliclyVisibleToolWhere } from "@/server/services/public-tool-visibility";
import type { ToolOutboundSource, ToolOutboundTarget } from "@/lib/tool-outbound";

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
    return tool.websiteUrl;
  }

  if (!tool.affiliateUrl) {
    throw new AppError(404, "Affiliate link not found.");
  }

  return tool.affiliateUrl;
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

  const destinationUrl = resolveTargetUrl(tool, input.target);
  const session = await getSessionFromRequest(input.request as never);
  const distinctId = session?.user.id ?? getAnonymousDistinctId();
  const sourcePath = getSourcePath(input.referer);

  try {
    await capturePostHogEvent({
      distinctId,
      event: "tool_outbound_click",
      properties: {
        tool_id: tool.id,
        tool_slug: tool.slug,
        tool_name: tool.name,
        destination_type: input.target,
        destination_url: destinationUrl,
        source_surface: input.source,
        source_path: sourcePath,
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

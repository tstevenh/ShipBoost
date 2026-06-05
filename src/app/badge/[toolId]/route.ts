import { readFileSync } from "node:fs";
import { join } from "node:path";

import { prisma } from "@/server/db/client";
import { getPubliclyVisibleToolWhere } from "@/server/services/public-tool-visibility";
import { getToolUpvoteCount } from "@/server/services/upvote-service";
import {
  buildBadgeSvg,
  extractSvgInner,
  type BadgeTheme,
} from "@/lib/distribution/badge-svg";

// Read the founder badge artwork once at module load and keep only the inner
// markup so we can nest it inside the combined (artwork + live count) badge.
const ARTWORK_INNER: Record<BadgeTheme, string> = {
  light: extractSvgInner(
    readFileSync(join(process.cwd(), "public/badge/featured-light.svg"), "utf8"),
  ),
  dark: extractSvgInner(
    readFileSync(join(process.cwd(), "public/badge/featured-dark.svg"), "utf8"),
  ),
};

type RouteContext = {
  params: Promise<{ toolId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { toolId } = await context.params;
  const themeParam = new URL(request.url).searchParams.get("theme");
  const theme: BadgeTheme = themeParam === "light" ? "light" : "dark";

  const tool = await prisma.tool.findFirst({
    where: { id: toolId, ...getPubliclyVisibleToolWhere() },
    select: { id: true },
  });

  if (!tool) {
    return new Response("Not found", { status: 404 });
  }

  const count = await getToolUpvoteCount(tool.id);
  const svg = buildBadgeSvg({ count, theme, artworkInner: ARTWORK_INNER[theme] });

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
    },
  });
}

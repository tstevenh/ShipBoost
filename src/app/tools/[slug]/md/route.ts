import { notFound } from "next/navigation";

import {
  getCachedToolPage,
  getCachedToolStaticParams,
} from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import { buildToolMarkdown } from "@/server/seo/page-markdown";
import { hasAlternativesSeoPage } from "@/server/services/seo-service";

export const revalidate = 3600;

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getCachedToolStaticParams();
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const toolPage = await getCachedToolPage(slug);

  if (!toolPage || toolPage.kind !== "public") {
    return notFound();
  }

  const markdown = buildToolMarkdown(
    { ...toolPage.tool, hasAlternativesPage: hasAlternativesSeoPage(slug) },
    getEnv().NEXT_PUBLIC_APP_URL,
  );

  return new Response(markdown, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

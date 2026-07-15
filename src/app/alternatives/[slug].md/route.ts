import { notFound } from "next/navigation";

import {
  getAlternativesStaticParams,
  getCachedAlternativesPage,
} from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import { buildAlternativesMarkdown } from "@/server/seo/page-markdown";

export const revalidate = 1800;

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAlternativesStaticParams();
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug: rawSlug } = await context.params;
  const slug = rawSlug.replace(/\.md$/, "");
  const page = await getCachedAlternativesPage(slug);

  if (!page) {
    return notFound();
  }

  const markdown = buildAlternativesMarkdown(page, getEnv().NEXT_PUBLIC_APP_URL);

  return new Response(markdown, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

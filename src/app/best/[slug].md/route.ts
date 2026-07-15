import { notFound } from "next/navigation";

import {
  getBestSeoStaticParams,
  getCachedBestSeoPage,
} from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import { buildBestMarkdown } from "@/server/seo/page-markdown";

export const revalidate = 1800;

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getBestSeoStaticParams();
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug: rawSlug } = await context.params;
  const slug = rawSlug.replace(/\.md$/, "");
  const page = await getCachedBestSeoPage(slug);

  if (!page) {
    return notFound();
  }

  const markdown = buildBestMarkdown(page, getEnv().NEXT_PUBLIC_APP_URL);

  return new Response(markdown, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

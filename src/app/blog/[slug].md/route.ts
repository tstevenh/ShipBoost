import { notFound } from "next/navigation";

import {
  getCachedBlogArticleStaticParams,
  getCachedPublishedBlogArticle,
} from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import { buildBlogMarkdown } from "@/server/seo/page-markdown";

export const revalidate = 3600;

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getCachedBlogArticleStaticParams();
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug: rawSlug } = await context.params;
  const slug = rawSlug.replace(/\.md$/, "");
  const article = await getCachedPublishedBlogArticle(slug);

  if (!article) {
    return notFound();
  }

  const markdown = buildBlogMarkdown(article, getEnv().NEXT_PUBLIC_APP_URL);

  return new Response(markdown, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

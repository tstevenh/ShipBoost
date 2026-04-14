import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogArticlePage } from "@/components/blog/blog-article-page";
import { JsonLdScript } from "@/components/seo/json-ld";
import {
  getCachedBlogArticleStaticParams,
  getCachedPublishedBlogArticle,
  getCachedRelatedPublishedBlogArticles,
} from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import {
  buildPublicPageMetadata,
  resolveSameOriginCanonicalUrl,
} from "@/server/seo/page-metadata";
import { buildBlogArticlePageSchema } from "@/server/seo/page-schema";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function toIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
}

export async function generateStaticParams() {
  return getCachedBlogArticleStaticParams();
}

export async function generateMetadata(context: RouteContext): Promise<Metadata> {
  const { slug } = await context.params;
  const article = await getCachedPublishedBlogArticle(slug);

  if (!article) {
    return {
      title: "Article not found | ShipBoost",
    };
  }

  const env = getEnv();
  const canonical = resolveSameOriginCanonicalUrl(
    article.canonicalUrl,
    `${env.NEXT_PUBLIC_APP_URL}/blog/${article.slug}`,
  );

  return buildPublicPageMetadata({
    title: article.metaTitle ?? `${article.title} | ShipBoost`,
    description: article.metaDescription ?? article.excerpt,
    url: canonical,
    openGraphType: "article",
    twitterCard:
      article.ogImageUrl || article.coverImageUrl ? "summary_large_image" : "summary",
    imageUrl: article.ogImageUrl ?? article.coverImageUrl,
  });
}

export default async function BlogArticleRoute(context: RouteContext) {
  const { slug } = await context.params;
  const article = await getCachedPublishedBlogArticle(slug);

  if (!article) {
    notFound();
  }

  const env = getEnv();
  const relatedArticles = await getCachedRelatedPublishedBlogArticles(
    article.id,
    article.primaryCategoryId,
    article.articleTags.map((item) => item.tagId),
  );
  const canonical = resolveSameOriginCanonicalUrl(
    article.canonicalUrl,
    `${env.NEXT_PUBLIC_APP_URL}/blog/${article.slug}`,
  );
  const schema = buildBlogArticlePageSchema({
    title: article.title,
    description: article.excerpt,
    url: canonical,
    authorName: article.author.name,
    image: article.ogImageUrl ?? article.coverImageUrl,
    publishedAt: toIsoString(article.publishedAt),
    updatedAt: toIsoString(article.lastUpdatedAt ?? article.updatedAt),
    categoryName: article.primaryCategory.name,
    categoryUrl: `${env.NEXT_PUBLIC_APP_URL}/blog/category/${article.primaryCategory.slug}`,
  });

  return (
    <>
      <JsonLdScript data={schema} />
      <BlogArticlePage article={article} relatedArticles={relatedArticles} />
    </>
  );
}

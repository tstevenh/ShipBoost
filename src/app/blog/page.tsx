import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld";
import { BlogIndexPage } from "@/components/blog/blog-index-page";
import { getCachedBlogIndexPage } from "@/server/cache/public-content";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";
import { buildBlogArchivePageSchema } from "@/server/seo/page-schema";
import { getEnv } from "@/server/env";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "ShipBoost Blog | SEO, SaaS Launches, and Trust-First Distribution",
  description:
    "Read practical ShipBoost articles on SEO, EEAT, SaaS launches, trust signals, and founder distribution that keeps compounding after launch week.",
  url: "/blog",
});

export default async function BlogPage() {
  const page = await getCachedBlogIndexPage();
  const env = getEnv();
  const schema = buildBlogArchivePageSchema({
    title: "ShipBoost Blog",
    description:
      "Practical ShipBoost articles on SEO, EEAT, SaaS launches, and trust-first distribution.",
    url: `${env.NEXT_PUBLIC_APP_URL}/blog`,
    breadcrumbs: [
      { name: "Home", url: env.NEXT_PUBLIC_APP_URL },
      { name: "Blog", url: `${env.NEXT_PUBLIC_APP_URL}/blog` },
    ],
    items: [page.featuredArticle, ...page.latestArticles]
      .filter((article): article is NonNullable<typeof article> => Boolean(article))
      .map((article) => ({
        name: article.title,
        url: `${env.NEXT_PUBLIC_APP_URL}/blog/${article.slug}`,
      })),
  });

  return (
    <>
      <JsonLdScript data={schema} />
      <BlogIndexPage page={page} />
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogArchivePage } from "@/components/blog/blog-archive-page";
import { JsonLdScript } from "@/components/seo/json-ld";
import {
  getCachedBlogTagPage,
  getCachedBlogTagStaticParams,
  getCachedPublicBlogCategories,
} from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";
import { buildBlogArchivePageSchema } from "@/server/seo/page-schema";
import { type SharedArticle } from "@/components/blog/blog-shared";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getCachedBlogTagStaticParams();
}

export async function generateMetadata(context: RouteContext): Promise<Metadata> {
  const { slug } = await context.params;
  const page = await getCachedBlogTagPage(slug);

  if (!page) {
    return {
      title: "Tag not found | ShipBoost",
    };
  }

  return buildPublicPageMetadata({
    title: page.metaTitle ?? `${page.name} Tag Articles | ShipBoost Blog`,
    description:
      page.metaDescription ??
      page.description ??
      `Browse ShipBoost articles tagged ${page.name}.`,
    url: `/blog/tag/${page.slug}`,
  });
}

export default async function BlogTagRoute(context: RouteContext) {
  const { slug } = await context.params;
  const [page, categories] = await Promise.all([
    getCachedBlogTagPage(slug),
    getCachedPublicBlogCategories(),
  ]);

  if (!page) {
    notFound();
  }

  const env = getEnv();
  const canonical = `${env.NEXT_PUBLIC_APP_URL}/blog/tag/${page.slug}`;
  const schema = buildBlogArchivePageSchema({
    title: `${page.name} Articles`,
    description:
      page.metaDescription ??
      page.description ??
      `Browse ShipBoost articles tagged ${page.name}.`,
    url: canonical,
    breadcrumbs: [
      { name: "Home", url: env.NEXT_PUBLIC_APP_URL },
      { name: "Blog", url: `${env.NEXT_PUBLIC_APP_URL}/blog` },
      { name: page.name, url: canonical },
    ],
    items: page.articles.map((article) => ({
      name: article.title,
      url: `${env.NEXT_PUBLIC_APP_URL}/blog/${article.slug}`,
    })),
  });

  return (
    <>
      <JsonLdScript data={schema} />
      <BlogArchivePage
        eyebrow="Blog tag"
        title={page.name}
        description={page.description ?? `Articles tagged ${page.name} on the ShipBoost blog.`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: page.name, href: `/blog/tag/${page.slug}` },
        ]}
        articles={page.articles as SharedArticle[]}
        categories={categories}
      />
    </>
  );
}

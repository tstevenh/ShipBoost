import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogArchivePage } from "@/components/blog/blog-archive-page";
import { JsonLdScript } from "@/components/seo/json-ld";
import {
  getCachedBlogCategoryPage,
  getCachedBlogCategoryStaticParams,
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
  return getCachedBlogCategoryStaticParams();
}

export async function generateMetadata(context: RouteContext): Promise<Metadata> {
  const { slug } = await context.params;
  const page = await getCachedBlogCategoryPage(slug);

  if (!page) {
    return {
      title: "Category not found | ShipBoost",
    };
  }

  return buildPublicPageMetadata({
    title: page.metaTitle ?? `${page.name} Articles | ShipBoost Blog`,
    description:
      page.metaDescription ??
      page.seoIntro ??
      `Browse ${page.name.toLowerCase()} articles on the ShipBoost blog.`,
    url: `/blog/category/${page.slug}`,
  });
}

export default async function BlogCategoryRoute(context: RouteContext) {
  const { slug } = await context.params;
  const [page, categories] = await Promise.all([
    getCachedBlogCategoryPage(slug),
    getCachedPublicBlogCategories(),
  ]);

  if (!page) {
    notFound();
  }

  const env = getEnv();
  const canonical = `${env.NEXT_PUBLIC_APP_URL}/blog/category/${page.slug}`;
  const schema = buildBlogArchivePageSchema({
    title: `${page.name} Articles`,
    description:
      page.metaDescription ??
      page.seoIntro ??
      `Browse ${page.name.toLowerCase()} articles on the ShipBoost blog.`,
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
        eyebrow="Blog category"
        title={page.name}
        description={
          page.seoIntro ??
          page.description ??
          `Browse ShipBoost articles related to ${page.name.toLowerCase()}.`
        }
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: page.name, href: `/blog/category/${page.slug}` },
        ]}
        articles={page.articles as SharedArticle[]}
        categories={categories}
        activeCategorySlug={page.slug}
      />
    </>
  );
}

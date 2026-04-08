import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicToolCard } from "@/components/public/public-tool-card";
import { getEnv } from "@/server/env";
import { getPublicCategoryPageBySlug } from "@/server/services/catalog-service";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  context: RouteContext,
): Promise<Metadata> {
  const { slug } = await context.params;
  const category = await getPublicCategoryPageBySlug(slug);

  if (!category) {
    return {
      title: "Category not found | Shipboost",
    };
  }

  const env = getEnv();
  const title =
    category.metaTitle?.trim() ||
    `${category.name} tools for bootstrapped SaaS founders | Shipboost`;
  const description =
    category.metaDescription?.trim() ||
    category.seoIntro?.trim() ||
    category.description?.trim() ||
    `Browse ${category.name} tools curated for bootstrapped SaaS founders on Shipboost.`;
  const canonical = `${env.NEXT_PUBLIC_APP_URL}/categories/${category.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Shipboost",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function CategoryPage(context: RouteContext) {
  const { slug } = await context.params;
  const category = await getPublicCategoryPageBySlug(slug);

  if (!category) {
    notFound();
  }

  const publishedCount = category.toolCategories.length;

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-16 sm:py-20">
      <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-10">
        <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
          Category
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-black">
          {category.name}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-black/66">
          {category.seoIntro ??
            category.description ??
            `Published ${category.name} tools for bootstrapped SaaS founders.`}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.5rem] border border-black/10 bg-[#fff9ef] p-4">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#9f4f1d] uppercase">
              Published tools
            </p>
            <p className="mt-2 text-3xl font-semibold text-black">{publishedCount}</p>
          </div>
          <div className="rounded-[1.5rem] border border-black/10 bg-[#fff9ef] p-4">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#9f4f1d] uppercase">
              Featured picks
            </p>
            <p className="mt-2 text-3xl font-semibold text-black">
              {category.featuredTools.length}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-black/10 bg-[#fff9ef] p-4">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#9f4f1d] uppercase">
              Strongest tags
            </p>
            <p className="mt-2 text-sm leading-7 text-black/66">
              {category.topTags.slice(0, 3).map((tag) => tag.name).join(", ") || "Still growing"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          {category.featuredTools.length > 0 ? (
            <section className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
              <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
                Featured tools
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-black">
                Best-known launches in {category.name}
              </h2>
              <div className="mt-6 grid gap-4">
                {category.featuredTools.map((tool) => (
                  <PublicToolCard
                    key={tool.slug}
                    tool={tool}
                    sourceSurface="category_featured"
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
                  All published tools
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-black">
                  Browse live listings in {category.name}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Link
                  href="/launches/daily"
                  className="rounded-full border border-black/10 px-3 py-1.5 font-medium text-black/65 transition hover:bg-black/[0.04]"
                >
                  Daily board
                </Link>
                <Link
                  href="/launches/weekly"
                  className="rounded-full border border-black/10 px-3 py-1.5 font-medium text-black/65 transition hover:bg-black/[0.04]"
                >
                  Weekly board
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {category.toolCategories.map((item) => (
                <PublicToolCard
                  key={item.tool.slug}
                  tool={item.tool}
                  sourceSurface="category_page"
                />
              ))}

              {category.toolCategories.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-black/15 bg-black/[0.02] px-5 py-10 text-center text-sm text-black/55">
                  No published tools in this category yet.
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[2rem] bg-[#143f35] p-8 text-[#f8efe3] shadow-[0_24px_80px_rgba(20,63,53,0.24)]">
            <p className="text-sm font-semibold tracking-[0.25em] text-[#f3c781] uppercase">
              Category context
            </p>
            <div className="mt-6 space-y-4 text-sm leading-7 text-[#f8efe3]/82">
              <p>
                This page curates {category.name.toLowerCase()} tools that are already
                published on Shipboost, so founders can compare real listings instead of
                dead directories.
              </p>
              <p>
                Use the featured block to spot stronger entries fast, then browse the full
                list for adjacent alternatives.
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
            <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
              Popular tags
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {category.topTags.map((tag) =>
                tag.isActive ? (
                  <Link
                    key={tag.id}
                    href={`/best/tag/${tag.slug}`}
                    className="rounded-full border border-black/10 bg-[#fff9ef] px-3 py-1.5 text-xs font-medium text-black transition hover:border-black/20 hover:bg-[#fff3de]"
                  >
                    {tag.name} ({tag.count})
                  </Link>
                ) : (
                  <span
                    key={tag.id}
                    className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs font-medium text-black/62"
                  >
                    {tag.name} ({tag.count})
                  </span>
                ),
              )}
              {category.topTags.length === 0 ? (
                <p className="text-sm text-black/55">No strong tag pattern yet.</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
            <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
              Related categories
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {category.relatedCategories.map((item) => (
                <Link
                  key={item.id}
                  href={`/categories/${item.slug}`}
                  className="rounded-full border border-black/10 bg-[#fff9ef] px-4 py-2 text-sm font-medium text-black transition hover:border-black/20 hover:bg-[#fff3de]"
                >
                  {item.name}
                </Link>
              ))}
              {category.relatedCategories.length === 0 ? (
                <p className="text-sm text-black/55">
                  Related categories will appear after more tools overlap.
                </p>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

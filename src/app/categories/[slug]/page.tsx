import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronRight, Home as HomeIcon, Layers } from "lucide-react";

import { JsonLdScript } from "@/components/seo/json-ld";
import { InternalLinkSection } from "@/components/seo/internal-link-section";
import { PublicDirectoryToolCard } from "@/components/public/public-directory-tool-card";
import { getEnv } from "@/server/env";
import { bestPagesRegistry } from "@/server/seo/best-pages";
import { ShowcaseLayout } from "@/components/public/showcase-layout";
import { ViewerVoteStateProvider } from "@/components/public/viewer-vote-state-provider";
import { Footer } from "@/components/ui/footer";
import { SortButton } from "@/components/public/sort-button";
import {
  SortableToolGrid,
  type SortableToolGridItem,
} from "@/components/public/sortable-tool-grid";
import {
  getCachedCategoryPage,
  getCachedCategoryStaticParams,
} from "@/server/cache/public-content";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";
import { buildCollectionWithBreadcrumbSchema } from "@/server/seo/page-schema";

export const revalidate = 1800;

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function mapToolToGridItem(tool: {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  websiteUrl: string;
  createdAt: Date | string;
  isFeatured: boolean;
  logoMedia: { url: string } | null;
  toolCategories: {
    category: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
  toolTags: {
    tag: {
      id: string;
      name: string | null;
      slug: string;
      isActive: boolean;
    };
  }[];
  _count?: { toolVotes?: number };
}): SortableToolGridItem {
  return {
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    logoUrl: tool.logoMedia?.url ?? undefined,
    websiteUrl: tool.websiteUrl,
    votes: tool._count?.toolVotes ?? 0,
    tags: tool.toolTags
      .map((item) => item.tag?.name)
      .filter((name): name is string => Boolean(name)),
    linkedTags: tool.toolTags
      .map((item) => item.tag)
      .filter(
        (
          tag,
        ): tag is {
          id: string;
          name: string;
          slug: string;
          isActive: boolean;
        } => Boolean(tag?.name && tag.slug),
      )
      .map((tag) => ({
        name: tag.name,
        slug: tag.slug,
      })),
    primaryCategory: tool.toolCategories[0]?.category ?? null,
    isFeatured: tool.isFeatured,
    createdAt: new Date(tool.createdAt).toISOString(),
  };
}

function renderStaticToolGrid(
  tools: SortableToolGridItem[],
  emptyMessage: string,
) {
  if (tools.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-16 text-center text-sm font-medium text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {tools.map((tool) => (
        <PublicDirectoryToolCard
          key={tool.id}
          toolId={tool.id}
          name={tool.name}
          tagline={tool.tagline}
          logoUrl={tool.logoUrl}
          websiteUrl={tool.websiteUrl}
          slug={tool.slug}
          votes={tool.votes}
          tags={tool.tags}
          linkedTags={tool.linkedTags}
          primaryCategory={tool.primaryCategory}
        />
      ))}
    </div>
  );
}

export async function generateStaticParams() {
  return getCachedCategoryStaticParams();
}

export async function generateMetadata(
  context: RouteContext,
): Promise<Metadata> {
  const { slug } = await context.params;
  const category = await getCachedCategoryPage(slug);

  if (!category) {
    return {
      title: "Category not found | ShipBoost",
    };
  }

  const env = getEnv();
  const title =
    category.metaTitle?.trim() ||
    `Best ${category.name} Tools for SaaS Founders | ShipBoost`;
  const description =
    category.metaDescription?.trim() ||
    `Discover the best ${category.name.toLowerCase()} tools on ShipBoost. Compare curated products, featured listings, and buyer-friendly options.`;
  const canonical = `${env.NEXT_PUBLIC_APP_URL}/categories/${category.slug}`;

  return buildPublicPageMetadata({
    title,
    description,
    url: canonical,
  });
}

export default async function CategoryPage(context: RouteContext) {
  const { slug } = await context.params;
  const category = await getCachedCategoryPage(slug);

  if (!category || !category.toolCategories) {
    notFound();
  }

  const allToolIds = [
    ...(category.featuredTools || []).map(t => t.id),
    ...category.toolCategories.map(tc => tc.tool.id)
  ];

  const publishedCount = category.toolCategories.length;
  const directoryTools = category.toolCategories.map((item) =>
    mapToolToGridItem(item.tool),
  );
  const featuredTools = (category.featuredTools || []).map(mapToolToGridItem);
  const env = getEnv();
  const canonical = `${env.NEXT_PUBLIC_APP_URL}/categories/${category.slug}`;
  const description =
    category.metaDescription?.trim() ||
    `Discover the best ${category.name.toLowerCase()} tools on ShipBoost. Compare curated products, featured listings, and buyer-friendly options.`;
  const schema = buildCollectionWithBreadcrumbSchema({
    name: `${category.name} Tools`,
    description,
    url: canonical,
    breadcrumbs: [
      { name: "Home", url: env.NEXT_PUBLIC_APP_URL },
      { name: "Categories", url: `${env.NEXT_PUBLIC_APP_URL}/categories` },
      { name: category.name, url: canonical },
    ],
    items: category.toolCategories.map((item) => ({
      name: item.tool.name,
      url: `${env.NEXT_PUBLIC_APP_URL}/tools/${item.tool.slug}`,
    })),
  });
  const relatedCategoryLinks = (category.relatedCategories || []).map((item) => ({
    href: `/categories/${item.slug}`,
    label: item.name,
    description: `Explore more ${item.name.toLowerCase()} tools on ShipBoost.`,
  }));
  const topTagLinks = (category.topTags || []).map((tag) => ({
    href: `/tags/${tag.slug}`,
    label: tag.name,
    description: `Browse tools tagged ${tag.name}.`,
  }));
  const bestPageLinks = Object.values(bestPagesRegistry)
    .filter((entry) => entry.primaryCategorySlug === category.slug)
    .slice(0, 3)
    .map((entry) => ({
      href: `/best/${entry.slug}`,
      label: entry.title,
      description: entry.metaDescription,
    }));
  const topTagNames = (category.topTags || []).slice(0, 3).map((tag) => tag.name);
  const relatedCategoryNames = (category.relatedCategories || [])
    .slice(0, 3)
    .map((item) => item.name);
  const resourceLinks = [
    {
      href: "/launch-guide",
      label: "Read the launch guide",
      description: "See how founders prepare products before launch day.",
    },
    {
      href: "/how-it-works",
      label: "How ShipBoost works",
      description: "Understand weekly launches, ranking, and listing visibility.",
    },
    {
      href: "/pricing",
      label: "Compare launch pricing",
      description: "Review Free Launch, Premium Launch, and done-for-you support.",
    },
  ];

  return (
    <main className="flex-1">
      <ViewerVoteStateProvider toolIds={allToolIds}>
        <JsonLdScript data={schema} />
        <ShowcaseLayout>
          <div className="space-y-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60  tracking-widest">
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <HomeIcon size={12} /> Home
            </Link>
            <ChevronRight size={12} />
            <Link href="/categories" className="hover:text-primary transition-colors">
              Categories
            </Link>
            <ChevronRight size={12} />
            <span className="text-primary font-black">
              {category.name}
            </span>
          </nav>

          {/* Header Section (Unboxed) */}
          <div className="max-w-4xl">
            <h1 className="text-5xl font-black tracking-tight text-foreground mb-6">
              {category.name} Tools
            </h1>
            <p className="text-lg font-medium leading-relaxed text-muted-foreground/80 mb-8 whitespace-pre-wrap">
              {category.seoIntro ?? category.description ?? `Explore our curated list of ${category.name} tools specifically for bootstrapped founders.`}
            </p>
            
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-4 py-2 px-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black  tracking-widest text-primary/60">Tools</span>
                  <span className="text-xl font-black text-primary">{publishedCount}</span>
                </div>
                <div className="w-px h-8 bg-primary/10" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black  tracking-widest text-primary/60">Premium</span>
                  <span className="text-xl font-black text-primary">{(category.featuredTools || []).length}</span>
                </div>
              </div>

              <Link 
                href="/categories"
                className="flex items-center gap-2 text-sm font-black text-primary hover:opacity-80 transition-opacity"
              >
                <Layers size={16} />
                Browse all categories
              </Link>
            </div>
          </div>

          <div className="space-y-12">
            {featuredTools.length > 0 ? (
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground ">
                    Premium picks
                  </p>
                </div>
                <div className="grid gap-5">
                  {featuredTools.map((tool) => (
                    <PublicDirectoryToolCard
                      key={`featured-${tool.id}`}
                      toolId={tool.id}
                      name={tool.name}
                      tagline={tool.tagline}
                      logoUrl={tool.logoUrl}
                      slug={tool.slug}
                      votes={tool.votes}
                      tags={tool.tags}
                      linkedTags={tool.linkedTags}
                      primaryCategory={tool.primaryCategory}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="space-y-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground ">
                    Directory
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                    All {category.name} tools
                  </h2>
                </div>
                <Suspense
                  fallback={
                    <div className="h-10 w-32 rounded-xl border border-border bg-card shadow-sm" />
                  }
                >
                  <SortButton />
                </Suspense>
              </div>

              <Suspense
                fallback={renderStaticToolGrid(
                  directoryTools,
                  "No tools published in this category yet.",
                )}
              >
                <SortableToolGrid
                  tools={directoryTools}
                  emptyMessage="No tools published in this category yet."
                />
              </Suspense>
            </section>

            <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
              <h2 className="text-3xl font-black tracking-tight text-foreground">
                How founders usually evaluate {category.name} tools
              </h2>
              <div className="mt-4 space-y-3 text-base font-medium leading-relaxed text-muted-foreground/80">
                <p>
                  This category currently includes {publishedCount} published tool
                  {publishedCount === 1 ? "" : "s"}
                  {(category.featuredTools || []).length > 0
                    ? `, with ${(category.featuredTools || []).length} featured pick${
                        (category.featuredTools || []).length === 1 ? "" : "s"
                      } surfaced separately.`
                    : "."}
                </p>
                {topTagNames.length > 0 ? (
                  <p>
                    Common overlaps in this category include {topTagNames.join(", ")}, which
                    helps you narrow the list by workflow instead of treating every{" "}
                    {category.name.toLowerCase()} tool as interchangeable.
                  </p>
                ) : null}
                {relatedCategoryNames.length > 0 ? (
                  <p>
                    If you are still mapping the problem space, the closest adjacent categories
                    here are {relatedCategoryNames.join(", ")}.
                  </p>
                ) : null}
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: "Workflow fit",
                    body: `Start by checking whether each tool actually matches the main job founders expect from ${category.name.toLowerCase()} software.`,
                  },
                  {
                    title: "Implementation cost",
                    body: `Compare setup complexity, pricing model, and how quickly a ${category.name.toLowerCase()} tool becomes useful in a real workflow.`,
                  },
                  {
                    title: "Compare nearby options",
                    body:
                      topTagNames.length > 0
                        ? `Use tags like ${topTagNames.slice(0, 2).join(" and ")} plus nearby categories to avoid choosing based on branding alone.`
                        : "Use related tags and adjacent categories to avoid choosing based on branding alone.",
                  },
                ].map((item) => (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-border bg-background p-5"
                  >
                    <h3 className="text-sm font-black text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <InternalLinkSection
              eyebrow="Related Categories"
              title={`Keep exploring beyond ${category.name}`}
              description="Category pages work best when they help you branch into adjacent tool clusters and narrower use cases."
              links={relatedCategoryLinks}
            />

            <InternalLinkSection
              eyebrow="Buyer Guides"
              title={`Best ${category.name} pages for specific buying intent`}
              description="These pages narrow the category down into specific comparison jobs instead of one broad directory view."
              links={bestPageLinks}
            />

            <InternalLinkSection
              eyebrow="Popular Tags"
              title={`Common tags across ${category.name} tools`}
              links={topTagLinks}
            />

            <InternalLinkSection
              eyebrow="Helpful Resources"
              title="Support pages for founders comparing tools"
              links={resourceLinks}
            />
          </div>
          </div>
        </ShowcaseLayout>
      </ViewerVoteStateProvider>
      <Footer />
    </main>
  );
}

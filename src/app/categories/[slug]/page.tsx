import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronRight, Home as HomeIcon, Layers } from "lucide-react";

import { ToolCard } from "@/components/ToolCard";
import { JsonLdScript } from "@/components/seo/json-ld";
import { PublicDirectoryToolCard } from "@/components/public/public-directory-tool-card";
import { getEnv } from "@/server/env";
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
  createdAt: Date | string;
  isFeatured: boolean;
  logoMedia: { url: string } | null;
  toolTags: { tag: { name: string | null } }[];
  _count?: { toolVotes?: number };
}): SortableToolGridItem {
  return {
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    logoUrl: tool.logoMedia?.url ?? undefined,
    votes: tool._count?.toolVotes ?? 0,
    tags: tool.toolTags
      .map((item) => item.tag?.name)
      .filter((name): name is string => Boolean(name)),
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
          slug={tool.slug}
          votes={tool.votes}
          tags={tool.tags}
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
    `${category.name} tools for bootstrapped SaaS founders | ShipBoost`;
  const description =
    category.metaDescription?.trim() ||
    category.seoIntro?.trim() ||
    category.description?.trim() ||
    `Browse ${category.name} tools curated for bootstrapped SaaS founders on ShipBoost.`;
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
      siteName: "ShipBoost",
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
    category.seoIntro?.trim() ||
    category.description?.trim() ||
    `Browse ${category.name} tools curated for bootstrapped SaaS founders on ShipBoost.`;
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
                  <span className="text-[10px] font-black  tracking-widest text-primary/60">Featured</span>
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
                    Featured picks
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
          </div>
          </div>
        </ShowcaseLayout>
      </ViewerVoteStateProvider>
      <Footer />
    </main>
  );
}

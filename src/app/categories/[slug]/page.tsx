import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Home as HomeIcon, Layers } from "lucide-react";

import { ToolCard } from "@/components/ToolCard";
import { getEnv } from "@/server/env";
import { getPublicCategoryPageBySlug } from "@/server/services/catalog-service";
import { ShowcaseLayout } from "@/components/public/showcase-layout";
import { getServerSession } from "@/server/auth/session";
import { getDailyVotesRemaining, listUserUpvotedToolIds } from "@/server/services/upvote-service";
import { Footer } from "@/components/ui/footer";
import { SortButton } from "@/components/public/sort-button";

type RouteContext = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ q?: string; sort?: string }>;
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
  const resolvedSearchParams = context.searchParams ? await context.searchParams : {};
  const currentSort = (resolvedSearchParams.sort as "newest" | "top") || "newest";
  
  const category = await getPublicCategoryPageBySlug(slug, currentSort);

  if (!category || !category.toolCategories) {
    notFound();
  }

  const session = await getServerSession();
  
  const allToolIds = [
    ...(category.featuredTools || []).map(t => t.id),
    ...category.toolCategories.map(tc => tc.tool.id)
  ];

  const [dailyVotesRemaining, upvotedToolIds] = await Promise.all([
    session?.user.id ? getDailyVotesRemaining(session.user.id) : Promise.resolve(null),
    session?.user.id ? listUserUpvotedToolIds(allToolIds, session.user.id) : Promise.resolve(new Set<string>()),
  ]);

  const publishedCount = category.toolCategories.length;

  return (
    <main className="flex-1">
      <ShowcaseLayout searchParams={resolvedSearchParams}>
        <div className="space-y-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
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
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Tools</span>
                  <span className="text-xl font-black text-primary">{publishedCount}</span>
                </div>
                <div className="w-px h-8 bg-primary/10" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Featured</span>
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
            {(category.featuredTools || []).length > 0 ? (
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
                    Featured picks
                  </p>
                </div>
                <div className="grid gap-5">
                  {(category.featuredTools || []).map((tool) => (
                    <ToolCard
                      key={`featured-${tool.slug}`}
                      toolId={tool.id}
                      name={tool.name}
                      tagline={tool.tagline}
                      logoUrl={tool.logoMedia?.url}
                      slug={tool.slug}
                      votes={tool._count?.toolVotes ?? 0}
                      hasUpvoted={upvotedToolIds.has(tool.id)}
                      tags={(tool.toolTags || []).map(tt => tt.tag?.name).filter((name): name is string => Boolean(name))}
                      initialDailyVotesRemaining={dailyVotesRemaining}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="space-y-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
                    Directory
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                    All {category.name} tools
                  </h2>
                </div>
                <SortButton />
              </div>

              <div className="grid gap-5">
                {category.toolCategories.map((item) => (
                  <ToolCard
                    key={item.tool.slug}
                    toolId={item.tool.id}
                    name={item.tool.name}
                    tagline={item.tool.tagline}
                    logoUrl={item.tool.logoMedia?.url}
                    slug={item.tool.slug}
                    votes={item.tool._count?.toolVotes ?? 0}
                    hasUpvoted={upvotedToolIds.has(item.tool.id)}
                    tags={(item.tool.toolTags || []).map(tt => tt.tag?.name).filter((name): name is string => Boolean(name))}
                    initialDailyVotesRemaining={dailyVotesRemaining}
                  />
                ))}

                {category.toolCategories.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-16 text-center text-sm font-medium text-muted-foreground">
                    No tools published in this category yet.
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </ShowcaseLayout>
      <Footer />
    </main>
  );
}

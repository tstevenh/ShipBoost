import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronRight, Home as HomeIcon, Trophy, Hash } from "lucide-react";
import Link from "next/link";

import { JsonLdScript } from "@/components/seo/json-ld";
import { InternalLinkSection } from "@/components/seo/internal-link-section";
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
  getCachedBestTagPage,
  getCachedBestTagStaticParams,
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
  return getCachedBestTagStaticParams();
}

export async function generateMetadata(
  context: RouteContext,
): Promise<Metadata> {
  const { slug } = await context.params;
  const page = await getCachedBestTagPage(slug);

  if (!page) {
    return {
      title: "Page not found | ShipBoost",
    };
  }

  const canonical = `${getEnv().NEXT_PUBLIC_APP_URL}/best/tag/${slug}`;

  return buildPublicPageMetadata({
    title: page.entry.metaTitle,
    description: page.entry.metaDescription,
    url: canonical,
  });
}

export default async function BestTagPage(context: RouteContext) {
  const { slug } = await context.params;
  const page = await getCachedBestTagPage(slug);

  if (!page || !page.tools) {
    notFound();
  }

  const allToolIds = (page.tools || []).map(t => t.id);
  const gridTools = page.tools.map(mapToolToGridItem);
  const env = getEnv();
  const canonical = `${env.NEXT_PUBLIC_APP_URL}/best/tag/${slug}`;
  const relatedCategoryMap = new Map<string, { name: string; slug: string; count: number }>();
  const relatedTagMap = new Map<string, { name: string; slug: string; count: number }>();

  for (const tool of page.tools) {
    for (const category of tool.toolCategories.map((item) => item.category)) {
      const current = relatedCategoryMap.get(category.slug);
      relatedCategoryMap.set(category.slug, {
        name: category.name,
        slug: category.slug,
        count: (current?.count ?? 0) + 1,
      });
    }

    for (const item of tool.toolTags) {
      if (item.tag.slug === slug) {
        continue;
      }

      const current = relatedTagMap.get(item.tag.slug);
      relatedTagMap.set(item.tag.slug, {
        name: item.tag.name,
        slug: item.tag.slug,
        count: (current?.count ?? 0) + 1,
      });
    }
  }

  const relatedCategoryLinks = [...relatedCategoryMap.values()]
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 6)
    .map((item) => ({
      href: `/categories/${item.slug}`,
      label: item.name,
      description: `Browse ${item.name.toLowerCase()} tools that overlap with this tag.`,
    }));
  const relatedTagLinks = [...relatedTagMap.values()]
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 6)
    .map((item) => ({
      href: `/best/tag/${item.slug}`,
      label: item.name,
      description: `Compare tools that share both ${page.tag.name} and ${item.name} intent.`,
    }));
  const relatedCategoryNames = [...relatedCategoryMap.values()]
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 3)
    .map((item) => item.name);
  const relatedTagNames = [...relatedTagMap.values()]
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 3)
    .map((item) => item.name);
  const schema = buildCollectionWithBreadcrumbSchema({
    name: `#${page.tag.name} Products`,
    description: page.entry.metaDescription,
    url: canonical,
    breadcrumbs: [
      { name: "Home", url: env.NEXT_PUBLIC_APP_URL },
      { name: "Tags", url: `${env.NEXT_PUBLIC_APP_URL}/tags` },
      { name: page.tag.name, url: canonical },
    ],
    items: page.tools.map((tool) => ({
      name: tool.name,
      url: `${env.NEXT_PUBLIC_APP_URL}/tools/${tool.slug}`,
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
            <Link href="/tags" className="hover:text-primary transition-colors">
              Tags
            </Link>
            <ChevronRight size={12} />
            <span className="text-primary font-black">
              #{page.tag.name}
            </span>
          </nav>

          {/* Header Section (Unboxed) */}
          <div className="max-w-4xl">
            <h1 className="text-5xl font-black tracking-tight text-foreground mb-6">
              #{page.tag.name} Products
            </h1>
            <p className="text-lg font-medium leading-relaxed text-muted-foreground/80 mb-8 whitespace-pre-wrap">
              {page.entry.intro}
            </p>
            
            <div className="flex flex-wrap items-center gap-6">
              <Link 
                href={`/best/tag/${slug}`}
                className="flex items-center gap-2 text-sm font-black text-primary hover:opacity-80 transition-opacity"
              >
                <Trophy size={16} />
                See the best {page.tag.name} products
              </Link>
              <Link 
                href="/tags"
                className="flex items-center gap-2 text-sm font-black text-primary hover:opacity-80 transition-opacity"
              >
                <Hash size={16} />
                See all the tags
              </Link>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="pt-4 border-t border-border/50">
            <Suspense
              fallback={
                <div className="h-10 w-32 rounded-xl border border-border bg-card shadow-sm" />
              }
            >
              <SortButton />
            </Suspense>
          </div>

          {/* Tools Grid */}
          <Suspense
            fallback={renderStaticToolGrid(
              gridTools,
              "No tools found for this tag yet.",
            )}
          >
            <SortableToolGrid
              tools={gridTools}
              emptyMessage="No tools found for this tag yet."
            />
          </Suspense>

          <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <h2 className="text-3xl font-black tracking-tight text-foreground">
              What founders usually mean by {page.tag.name}
            </h2>
            <div className="mt-4 space-y-3 text-base font-medium leading-relaxed text-muted-foreground/80">
              <p>
                This tag currently spans {page.tools.length} published product
                {page.tools.length === 1 ? "" : "s"}
                {relatedCategoryNames.length > 0
                  ? ` across categories like ${relatedCategoryNames.join(", ")}.`
                  : "."}
              </p>
              {relatedTagNames.length > 0 ? (
                <p>
                  It also overlaps with tags such as {relatedTagNames.join(", ")}, which is why
                  this page works best as a refinement layer rather than a single product
                  category.
                </p>
              ) : null}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Shared capability",
                  body: `This tag groups products that overlap around ${page.tag.name.toLowerCase()} instead of forcing them into one narrow product category.`,
                },
                {
                  title: "Better discovery",
                  body:
                    relatedCategoryNames.length > 0
                      ? `Tags help you compare tools across ${relatedCategoryNames.slice(0, 2).join(" and ")} without losing the shared capability you are looking for.`
                      : "Tags help you find tools that solve a similar problem even when they live in different categories.",
                },
                {
                  title: "Next comparison step",
                  body:
                    relatedTagNames.length > 0
                      ? `After you know ${page.tag.name} matters, use nearby tags like ${relatedTagNames.slice(0, 2).join(" and ")} to narrow the field.`
                      : "Use related tags and categories to narrow the list after you know which capability matters most.",
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
            title={`Categories connected to ${page.tag.name}`}
            links={relatedCategoryLinks}
          />

          <InternalLinkSection
            eyebrow="Related Tags"
            title={`Explore tags near ${page.tag.name}`}
            links={relatedTagLinks}
          />

          <InternalLinkSection
            eyebrow="Founder Resources"
            title="Helpful pages while comparing tagged products"
            links={[
              {
                href: "/launch-guide",
                label: "Read the launch guide",
                description: "Prepare your product before joining a launch week.",
              },
              {
                href: "/how-it-works",
                label: "How ShipBoost works",
                description: "Learn how listings, launch weeks, and ranking operate.",
              },
              {
                href: "/alternatives",
                label: "Browse alternatives",
                description: "Move into direct comparison pages after tag-based discovery.",
              },
            ]}
          />
          </div>
        </ShowcaseLayout>
      </ViewerVoteStateProvider>
      <Footer />
    </main>
  );
}

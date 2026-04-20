import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Home as HomeIcon, ListFilter, ExternalLink } from "lucide-react";

import { JsonLdScript } from "@/components/seo/json-ld";
import { InternalLinkSection } from "@/components/seo/internal-link-section";
import { PublicDirectoryToolCard } from "@/components/public/public-directory-tool-card";
import { getEnv } from "@/server/env";
import { ShowcaseLayout } from "@/components/public/showcase-layout";
import { ViewerVoteStateProvider } from "@/components/public/viewer-vote-state-provider";
import { Footer } from "@/components/ui/footer";
import {
  getAlternativesStaticParams,
  getCachedAlternativesPage,
} from "@/server/cache/public-content";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";
import { buildCollectionWithBreadcrumbSchema } from "@/server/seo/page-schema";
import { alternativesSeoRegistry } from "@/server/seo/registry";

export const revalidate = 1800;
export const dynamicParams = false;

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAlternativesStaticParams();
}

export async function generateMetadata(
  context: RouteContext,
): Promise<Metadata> {
  const { slug } = await context.params;
  const page = await getCachedAlternativesPage(slug);

  if (!page) {
    return {
      title: "Page not found | ShipBoost",
    };
  }

  const canonical = `${getEnv().NEXT_PUBLIC_APP_URL}/alternatives/${slug}`;

  return buildPublicPageMetadata({
    title: page.entry.metaTitle,
    description: page.entry.metaDescription,
    url: canonical,
  });
}

export default async function AlternativesPage(context: RouteContext) {
  const { slug } = await context.params;
  const page = await getCachedAlternativesPage(slug);

  if (!page || !page.tools) {
    notFound();
  }

  const allToolIds = (page.tools || []).map(t => t.id);
  const env = getEnv();
  const canonical = `${env.NEXT_PUBLIC_APP_URL}/alternatives/${slug}`;
  const categoryMap = new Map<string, { name: string; slug: string; count: number }>();
  const tagMap = new Map<string, { name: string; slug: string; count: number }>();
  const allComparedTools = [page.anchorTool, ...page.tools];

  for (const tool of allComparedTools) {
    for (const category of tool.toolCategories.map((item) => item.category)) {
      const current = categoryMap.get(category.slug);
      categoryMap.set(category.slug, {
        name: category.name,
        slug: category.slug,
        count: (current?.count ?? 0) + 1,
      });
    }

    for (const item of tool.toolTags) {
      const current = tagMap.get(item.tag.slug);
      tagMap.set(item.tag.slug, {
        name: item.tag.name,
        slug: item.tag.slug,
        count: (current?.count ?? 0) + 1,
      });
    }
  }

  const relatedCategoryLinks = [...categoryMap.values()]
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 6)
    .map((item) => ({
      href: `/categories/${item.slug}`,
      label: item.name,
      description: `Browse more ${item.name.toLowerCase()} tools on ShipBoost.`,
    }));
  const relatedTagLinks = [...tagMap.values()]
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 6)
    .map((item) => ({
      href: `/tags/${item.slug}`,
      label: item.name,
      description: `See tools tagged ${item.name}.`,
    }));
  const relatedComparisonLinks = Object.values(alternativesSeoRegistry)
    .filter((entry) => entry.slug !== slug)
    .slice(0, 4)
    .map((entry) => ({
      href: `/alternatives/${entry.slug}`,
      label: entry.title,
      description: entry.metaDescription,
    }));
  const relatedCategoryNames = [...categoryMap.values()]
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 3)
    .map((item) => item.name);
  const relatedTagNames = [...tagMap.values()]
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 3)
    .map((item) => item.name);
  const schema = buildCollectionWithBreadcrumbSchema({
    name: page.entry.title,
    description: page.entry.metaDescription,
    url: canonical,
    breadcrumbs: [
      { name: "Home", url: env.NEXT_PUBLIC_APP_URL },
      { name: "Alternatives", url: `${env.NEXT_PUBLIC_APP_URL}/alternatives` },
      { name: page.anchorTool.name, url: canonical },
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
          <nav className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60  tracking-[0.2em]">
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <HomeIcon size={10} /> Home
            </Link>
            <ChevronRight size={10} />
            <Link
              href="/alternatives"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Alternatives
            </Link>
            <ChevronRight size={10} />
            <span className="text-primary font-black">
              {page.anchorTool.name}
            </span>
          </nav>

          {/* Header Section */}
          <div className="max-w-4xl">
            <h1 className="text-5xl font-black tracking-tight text-foreground mb-6">
              {page.entry.title}
            </h1>
            <p className="text-lg font-medium leading-relaxed text-muted-foreground/80 mb-8 whitespace-pre-wrap">
              {page.entry.intro}
            </p>

            <div className="flex items-center gap-4 p-6 bg-primary/5 rounded-2xl border border-primary/10 group hover:border-primary/20 transition-all">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {page.anchorTool.logoMedia ? (
                  <div className="relative h-full w-full overflow-hidden rounded-xl">
                    <Image
                      src={page.anchorTool.logoMedia.url}
                      alt={`${page.anchorTool.name} logo`}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <span className="font-black text-xs">{page.anchorTool.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black  tracking-widest text-primary/60 mb-1">Anchor Product</p>
                <h2 className="text-lg font-black text-foreground truncate">{page.anchorTool.name}</h2>
              </div>
              <Link 
                href={`/tools/${page.anchorTool.slug}`}
                className="flex items-center gap-2 text-xs font-black text-primary hover:underline"
              >
                View Listing <ExternalLink size={14} />
              </Link>
            </div>
          </div>

          {/* Tools Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <h3 className="text-[10px] font-black  tracking-[0.2em] text-muted-foreground/60">Top Alternatives</h3>
              <div className="flex items-center gap-3 px-3 py-1.5 bg-card border border-border rounded-lg w-fit shadow-sm">
                <ListFilter size={12} className="text-muted-foreground" />
                <span className="text-[10px] font-bold  tracking-widest">Newest</span>
              </div>
            </div>

            <div className="grid gap-5">
              {page.tools.map((tool) => (
                <PublicDirectoryToolCard
                  key={tool.id}
                  toolId={tool.id}
                  name={tool.name}
                  tagline={tool.tagline}
                  logoUrl={tool.logoMedia?.url}
                  websiteUrl={tool.websiteUrl}
                  slug={tool.slug}
                  votes={tool._count?.toolVotes ?? 0}
                  tags={(tool.toolTags || []).map(tt => tt.tag?.name).filter((name): name is string => Boolean(name))}
                  linkedTags={(tool.toolTags || [])
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
                    }))}
                  primaryCategory={tool.toolCategories[0]?.category ?? null}
                />
              ))}
            </div>
          </div>

          <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <h2 className="text-3xl font-black tracking-tight text-foreground">
              How to compare alternatives to {page.anchorTool.name}
            </h2>
            <div className="mt-4 space-y-3 text-base font-medium leading-relaxed text-muted-foreground/80">
              <p>
                This page compares {page.tools.length} alternative
                {page.tools.length === 1 ? "" : "s"} against {page.anchorTool.name}, so the goal
                is not just to find substitutes, but to understand where each product fits better.
              </p>
              {relatedCategoryNames.length > 0 ? (
                <p>
                  The overlap here is strongest around {relatedCategoryNames.join(", ")}, which
                  gives you a better signal than comparing brand names alone.
                </p>
              ) : null}
              {relatedTagNames.length > 0 ? (
                <p>
                  Shared tags like {relatedTagNames.join(", ")} also show where the tools compete
                  directly and where they branch into different use cases.
                </p>
              ) : null}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Keep the anchor in view",
                  body: `The point of this page is not to dismiss ${page.anchorTool.name}, but to make it easier to compare where it fits against close substitutes.`,
                },
                {
                  title: "Compare workflow fit",
                  body:
                    relatedCategoryNames.length > 0
                      ? `Look at category overlap across ${relatedCategoryNames.slice(0, 2).join(" and ")}, product focus, and which jobs each tool is designed to handle well.`
                      : "Look at category overlap, product focus, and which jobs each tool is designed to handle well.",
                },
                {
                  title: "Use nearby discovery paths",
                  body:
                    relatedTagNames.length > 0
                      ? `Category and tag hubs like ${relatedTagNames.slice(0, 2).join(" and ")} help you widen the comparison set once you understand the core tradeoff.`
                      : "Category and tag hubs help you widen the comparison set once you understand the core tradeoff.",
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
            title="Category paths around this comparison"
            links={relatedCategoryLinks}
          />

          <InternalLinkSection
            eyebrow="Related Tags"
            title="Tags that show up across these tools"
            links={relatedTagLinks}
          />

          <InternalLinkSection
            eyebrow="More Comparisons"
            title="Other alternative pages on ShipBoost"
            links={relatedComparisonLinks}
          />
          </div>
        </ShowcaseLayout>
      </ViewerVoteStateProvider>
      <Footer />
    </main>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronRight, Home as HomeIcon, Trophy, Hash } from "lucide-react";
import Link from "next/link";

import { ToolCard } from "@/components/ToolCard";
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
  return getCachedBestTagStaticParams();
}

export async function generateMetadata(
  context: RouteContext,
): Promise<Metadata> {
  const { slug } = await context.params;
  const page = await getCachedBestTagPage(slug);

  if (!page) {
    return {
      title: "Page not found | Shipboost",
    };
  }

  const canonical = `${getEnv().NEXT_PUBLIC_APP_URL}/best/tag/${slug}`;

  return {
    title: page.entry.metaTitle,
    description: page.entry.metaDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      title: page.entry.metaTitle,
      description: page.entry.metaDescription,
      url: canonical,
      siteName: "Shipboost",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: page.entry.metaTitle,
      description: page.entry.metaDescription,
    },
  };
}

export default async function BestTagPage(context: RouteContext) {
  const { slug } = await context.params;
  const page = await getCachedBestTagPage(slug);

  if (!page || !page.tools) {
    notFound();
  }

  const allToolIds = (page.tools || []).map(t => t.id);
  const gridTools = page.tools.map(mapToolToGridItem);

  return (
    <main className="flex-1">
      <ViewerVoteStateProvider toolIds={allToolIds}>
        <ShowcaseLayout>
          <div className="space-y-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
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
          </div>
        </ShowcaseLayout>
      </ViewerVoteStateProvider>
      <Footer />
    </main>
  );
}

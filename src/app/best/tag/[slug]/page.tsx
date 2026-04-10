import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronRight, Home as HomeIcon, Trophy, Hash } from "lucide-react";
import Link from "next/link";

import { ToolCard } from "@/components/ToolCard";
import { getEnv } from "@/server/env";
import { getBestTagSeoPage } from "@/server/services/seo-service";
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
  const page = await getBestTagSeoPage(slug);

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
  const resolvedSearchParams = context.searchParams ? await context.searchParams : {};
  const currentSort = (resolvedSearchParams.sort as "newest" | "top") || "newest";
  
  const page = await getBestTagSeoPage(slug, currentSort);

  if (!page || !page.tools) {
    notFound();
  }

  const session = await getServerSession();
  const allToolIds = (page.tools || []).map(t => t.id);

  const [dailyVotesRemaining, upvotedToolIds] = await Promise.all([
    session?.user.id ? getDailyVotesRemaining(session.user.id) : Promise.resolve(null),
    session?.user.id ? listUserUpvotedToolIds(allToolIds, session.user.id) : Promise.resolve(new Set<string>()),
  ]);

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
            <SortButton />
          </div>

          {/* Tools Grid */}
          <div className="grid gap-5">
            {page.tools.map((tool) => (
              <ToolCard
                key={tool.id}
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
            
            {page.tools.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-16 text-center text-sm font-medium text-muted-foreground">
                No tools found for this tag yet.
              </div>
            )}
          </div>
        </div>
      </ShowcaseLayout>
      <Footer />
    </main>
  );
}

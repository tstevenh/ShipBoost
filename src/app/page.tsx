import Link from "next/link";
import MinimalHero from "@/components/ui/hero-minimalism";
import { FilterBar } from "@/components/FilterBar";
import { ToolCard } from "@/components/ToolCard";
import { Footer } from "@/components/ui/footer";
import { listPublicCategories } from "@/server/services/catalog-service";
import { getServerSession } from "@/server/auth/session";
import { listLaunchBoard } from "@/server/services/launch-service";
import { getDailyVotesRemaining } from "@/server/services/upvote-service";
import { Suspense } from "react";
import { ShowcaseLayout } from "@/components/public/showcase-layout";
import { PrelaunchSurface } from "@/components/public/prelaunch-surface";
import { getEnv } from "@/server/env";
import { prisma } from "@/server/db/client";
import { getPubliclyVisibleToolWhere } from "@/server/services/public-tool-visibility";

type HomePageProps = {
  searchParams?: Promise<{
    q?: string;
    period?: string;
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const session = await getServerSession();
  const env = getEnv();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const currentPeriod = (resolvedSearchParams.period as "daily" | "weekly" | "monthly" | "yearly") || "daily";
  
  const isPrelaunch = env.NEXT_PUBLIC_PRELAUNCH_MODE === "true";

  const [launches, categories, dailyVotesRemaining, prelaunchTools] = await Promise.all([
    listLaunchBoard(currentPeriod, {
      viewerUserId: session?.user.id ?? null,
    }),
    listPublicCategories(),
    session?.user.id
      ? getDailyVotesRemaining(session.user.id)
      : Promise.resolve(null),
    isPrelaunch 
      ? prisma.tool.findMany({
          where: getPubliclyVisibleToolWhere(),
          take: 6,
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, tagline: true, slug: true, logoMedia: { select: { url: true } } }
        })
      : Promise.resolve([])
  ]);

  const periodLabels: Record<string, string> = {
    daily: "Today",
    weekly: "This Week",
    monthly: "This Month",
    yearly: "This Year"
  };

  const formattedPrelaunchTools = prelaunchTools.map(t => ({
    id: t.id,
    name: t.name,
    tagline: t.tagline,
    slug: t.slug,
    logoUrl: t.logoMedia?.url
  }));

  return (
    <main className="flex-1">
      {/* Full Width Hero */}
      <MinimalHero />
      
      {/* Filter Bar (Hidden in prelaunch mode if preferred, but keeping for SEO/Nav consistency) */}
      {!isPrelaunch && (
        <Suspense fallback={<div className="h-[73px] border-b border-border bg-background" />}>
          <FilterBar />
        </Suspense>
      )}
      
      <ShowcaseLayout searchParams={resolvedSearchParams} isHomePage isPrelaunch={isPrelaunch}>
        <div className="space-y-10 min-h-[600px]">
          {isPrelaunch ? (
            <PrelaunchSurface tools={formattedPrelaunchTools} />
          ) : (
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-black tracking-tight">
                    Launch Pad
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-muted text-foreground text-[10px] font-black uppercase tracking-wider border border-border">
                    {periodLabels[currentPeriod]}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Live Feed
                </div>
              </div>
              
              <div className="grid gap-5">
                {launches.map((launch, idx) => (
                  <ToolCard 
                    key={launch.id} 
                    toolId={launch.tool.id}
                    name={launch.tool.name}
                    tagline={launch.tool.tagline}
                    logoUrl={launch.tool.logoMedia?.url}
                    slug={launch.tool.slug}
                    votes={launch.tool.upvoteCount}
                    hasUpvoted={launch.tool.hasUpvoted}
                    tags={launch.tool.toolCategories.map(tc => tc.category.name)}
                    rank={idx + 1}
                    initialDailyVotesRemaining={dailyVotesRemaining}
                  />
                ))}
                {launches.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-32 bg-card rounded-2xl border border-dashed border-border">
                    <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest">
                      No launches found for this period.
                    </p>
                    <Link href="/submit" className="mt-4 text-sm font-black text-foreground hover:opacity-70 transition-all">
                      Submit a product →
                    </Link>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </ShowcaseLayout>
      
      <Footer />
    </main>
  );
}

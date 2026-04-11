import Link from "next/link";
import MinimalHero from "@/components/ui/hero-minimalism";
import { FilterBar } from "@/components/FilterBar";
import { PublicDirectoryToolCard } from "@/components/public/public-directory-tool-card";
import { Footer } from "@/components/ui/footer";
import { Suspense } from "react";
import { ShowcaseLayout } from "@/components/public/showcase-layout";
import { PrelaunchSurface } from "@/components/public/prelaunch-surface";
import { ViewerVoteStateProvider } from "@/components/public/viewer-vote-state-provider";
import { getEnv } from "@/server/env";
import { getCachedHomePageData } from "@/server/cache/public-content";

export const revalidate = 300;

export default async function Home() {
  const env = getEnv();
  const currentPeriod = "daily";
  const isPrelaunch = env.NEXT_PUBLIC_PRELAUNCH_MODE === "true";

  const { launches, prelaunchTools } = await getCachedHomePageData(
    currentPeriod,
    isPrelaunch,
  );

  const periodLabels: Record<string, string> = {
    daily: "Today",
    weekly: "This Week",
    monthly: "This Month",
    yearly: "This Year"
  };

  const launchToolIds = launches.map((launch) => launch.tool.id);

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
      
      <ViewerVoteStateProvider toolIds={launchToolIds}>
        <ShowcaseLayout isHomePage isPrelaunch={isPrelaunch}>
          <div className="space-y-10 min-h-[600px]">
            {isPrelaunch ? (
              <PrelaunchSurface tools={prelaunchTools} />
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
                    <PublicDirectoryToolCard
                      key={launch.id} 
                      toolId={launch.tool.id}
                      name={launch.tool.name}
                      tagline={launch.tool.tagline}
                      logoUrl={launch.tool.logoMedia?.url}
                      slug={launch.tool.slug}
                      votes={launch.tool.upvoteCount}
                      tags={launch.tool.toolCategories.map(tc => tc.category.name)}
                      rank={idx + 1}
                      imagePriority={idx < 3}
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
      </ViewerVoteStateProvider>
      
      <Footer />
    </main>
  );
}

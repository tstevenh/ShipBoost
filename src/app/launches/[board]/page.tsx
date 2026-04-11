import { notFound } from "next/navigation";
import { Suspense } from "react";

import { FilterBar } from "@/components/FilterBar";
import { PublicDirectoryToolCard } from "@/components/public/public-directory-tool-card";
import { ShowcaseLayout } from "@/components/public/showcase-layout";
import { ViewerVoteStateProvider } from "@/components/public/viewer-vote-state-provider";
import { Footer } from "@/components/ui/footer";
import {
  getCachedLaunchBoard,
  getLaunchBoardStaticParams,
  isPublicLaunchBoard,
} from "@/server/cache/public-content";

export const revalidate = 300;
export const dynamicParams = false;

type RouteContext = {
  params: Promise<{ board: string }>;
};

export function generateStaticParams() {
  return getLaunchBoardStaticParams();
}

export default async function LaunchBoardPage(context: RouteContext) {
  const { board } = await context.params;

  if (!isPublicLaunchBoard(board)) {
    notFound();
  }

  const launches = await getCachedLaunchBoard(board);
  const toolIds = launches.map((launch) => launch.tool.id);

  const boardLabels: Record<string, string> = {
    daily: "Today",
    weekly: "This Week",
    monthly: "This Month",
    yearly: "This Year"
  };

  return (
    <main className="flex-1">
      <Suspense
        fallback={<div className="h-[73px] border-b border-border bg-background" />}
      >
        <FilterBar />
      </Suspense>
      <ViewerVoteStateProvider toolIds={toolIds}>
        <ShowcaseLayout>
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-extrabold tracking-tight">
                  Launch Pad
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                  {boardLabels[board]}
                </span>
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
                  <p className="text-muted-foreground font-medium">
                    No launches found for this period.
                  </p>
                </div>
              )}
            </div>
          </div>
        </ShowcaseLayout>
      </ViewerVoteStateProvider>
      <Footer />
    </main>
  );
}

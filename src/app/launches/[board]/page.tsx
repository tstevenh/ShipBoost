import { notFound } from "next/navigation";

import { ToolCard } from "@/components/ToolCard";
import { getServerSession } from "@/server/auth/session";
import { listLaunchBoard } from "@/server/services/launch-service";
import { getDailyVotesRemaining } from "@/server/services/upvote-service";
import { ShowcaseLayout } from "@/components/public/showcase-layout";
import { Footer } from "@/components/ui/footer";

type RouteContext = {
  params: Promise<{ board: string }>;
  searchParams?: Promise<{ q?: string }>;
};

export default async function LaunchBoardPage(context: RouteContext) {
  const { board } = await context.params;
  const resolvedSearchParams = context.searchParams ? await context.searchParams : {};

  if (!["daily", "weekly", "monthly", "yearly"].includes(board)) {
    notFound();
  }

  const session = await getServerSession();
  const [launches, dailyVotesRemaining] = await Promise.all([
    listLaunchBoard(board as any, {
      viewerUserId: session?.user.id ?? null,
    }),
    session?.user.id
      ? getDailyVotesRemaining(session.user.id)
      : Promise.resolve(null),
  ]);

  const boardLabels: Record<string, string> = {
    daily: "Today",
    weekly: "This Week",
    monthly: "This Month",
    yearly: "This Year"
  };

  return (
    <main className="flex-1">
      <ShowcaseLayout searchParams={resolvedSearchParams}>
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
                <p className="text-muted-foreground font-medium">
                  No launches found for this period.
                </p>
              </div>
            )}
          </div>
        </div>
      </ShowcaseLayout>
      <Footer />
    </main>
  );
}

import Link from "next/link";

import { LaunchpadOpeningCountdown } from "@/components/public/launchpad-opening-countdown";
import { PublicDirectoryToolCard } from "@/components/public/public-directory-tool-card";
import type { PublicLaunchBoard } from "@/server/cache/public-content";
import type { LaunchBoardEntry } from "@/server/services/launch-service";

const boardLabels: Record<PublicLaunchBoard, string> = {
  weekly: "This Week",
  monthly: "This Month",
  yearly: "This Year",
};

export function LaunchpadShowcase({
  board,
  launches,
  emptyState = "default",
  launchpadGoLiveAt,
}: {
  board: PublicLaunchBoard;
  launches: LaunchBoardEntry[];
  emptyState?: "default" | "prelaunch-countdown";
  launchpadGoLiveAt?: string;
}) {
  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-black tracking-tight">Launch Pad</h2>
          <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-black  tracking-wider text-foreground">
            {boardLabels[board]}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black  tracking-widest text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Weekly cycle
        </div>
      </div>

      <div className="grid gap-5">
        {launches.map((launch, index) => (
          <PublicDirectoryToolCard
            key={launch.id}
            toolId={launch.tool.id}
            name={launch.tool.name}
            tagline={launch.tool.tagline}
            logoUrl={launch.tool.logoMedia?.url}
            websiteUrl={launch.tool.websiteUrl}
            slug={launch.tool.slug}
            votes={launch.tool.upvoteCount}
            primaryCategory={launch.tool.toolCategories[0]?.category ?? null}
            rank={index + 1}
            imagePriority={index < 3}
          />
        ))}

        {launches.length === 0 &&
        emptyState === "prelaunch-countdown" &&
        launchpadGoLiveAt ? (
          <LaunchpadOpeningCountdown launchpadGoLiveAt={launchpadGoLiveAt} />
        ) : null}

        {launches.length === 0 && emptyState === "default" ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-32">
            <p className="text-xs font-black  tracking-widest text-muted-foreground">
              No launches found for this period.
            </p>
            <Link
              href="/submit"
              className="mt-4 text-sm font-black text-foreground transition-all hover:opacity-70"
            >
              Submit a product →
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

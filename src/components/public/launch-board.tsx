import Link from "next/link";

import { PostHogImpressionTracker } from "@/components/analytics/posthog-impression-tracker";
import { buildToolOutboundHref } from "@/lib/tool-outbound";
import { ToolUpvoteButton } from "@/components/public/tool-upvote-button";
import { LogoFallback } from "@/components/ui/logo-fallback";

type LaunchItem = {
  id: string;
  launchType: "FREE" | "FEATURED" | "RELAUNCH";
  status: "PENDING" | "APPROVED" | "LIVE" | "ENDED" | "REJECTED";
  launchDate: Date;
  priorityWeight: number;
  tool: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    websiteUrl: string;
    affiliateUrl: string | null;
    logoMedia: { url: string } | null;
    upvoteCount: number;
    hasUpvoted: boolean;
    toolCategories: Array<{
      category: { name: string; slug: string };
    }>;
  };
};

function toneClassName() {
  return "border-amber-500/20 bg-amber-500/10 text-amber-700";
}

export function LaunchBoard({
  board,
  launches,
  dailyVotesRemaining,
}: {
  board: "weekly" | "monthly" | "yearly";
  launches: LaunchItem[];
  dailyVotesRemaining?: number | null;
}) {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-border bg-card p-8 sm:p-10">
        <p className="text-[10px] font-black tracking-[0.2em] text-foreground/40 ">
          Launch board
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-tight ">
          {board[0].toUpperCase() + board.slice(1)} launches
        </h1>
        <p className="mt-4 max-w-3xl text-lg font-medium leading-relaxed text-muted-foreground/80">
          Live and recent launches ranked by priority and recency.
        </p>
      </div>

      <div className="grid gap-4">
        {launches.map((launch, index) => {
          const outboundHref = buildToolOutboundHref({
            websiteUrl: launch.tool.websiteUrl,
            affiliateUrl: launch.tool.affiliateUrl,
            source: "launch_board",
            toolSlug: launch.tool.slug,
          });

          return (
          <article
            key={launch.id}
            className="group relative rounded-2xl border border-border bg-card p-5 transition-all hover:border-foreground/20 hover:shadow-lg hover:shadow-black/5"
          >
            <PostHogImpressionTracker
              eventName="product_card_impression"
              impressionId={`launch_board:${launch.id}:${launch.tool.id}`}
              properties={{
                placement_type: "product_card",
                tool_id: launch.tool.id,
                tool_slug: launch.tool.slug,
                tool_name: launch.tool.name,
                source_surface: "launch_board",
                position: index + 1,
                is_featured: launch.launchType === "FEATURED",
                current_launch_type: launch.launchType,
              }}
            />
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <LogoFallback
                  name={launch.tool.name}
                  src={launch.tool.logoMedia?.url}
                  websiteUrl={launch.tool.websiteUrl}
                  sizes="64px"
                  className="h-16 w-16 shrink-0 rounded-xl border border-border"
                  textClassName="text-lg"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/tools/${launch.tool.slug}`}
                      className="text-xl font-black transition-colors hover:text-foreground/70"
                    >
                      {launch.tool.name}
                    </Link>
                    {launch.launchType === "FEATURED" ? (
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-black tracking-widest ${toneClassName()}`}
                      >
                        Premium
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-1 text-base text-muted-foreground font-medium leading-relaxed">
                    {launch.tool.tagline}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <p className="text-[10px] font-black tracking-widest text-muted-foreground/40 ">
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(launch.launchDate))}
                    </p>
                    <div className="flex gap-1.5">
                      {launch.tool.toolCategories.map((item) => (
                        <Link
                          key={item.category.slug}
                          href={`/categories/${item.category.slug}`}
                          className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-black  tracking-widest text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {item.category.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 lg:shrink-0">
                <ToolUpvoteButton
                  toolId={launch.tool.id}
                  initialCount={launch.tool.upvoteCount}
                  initialHasUpvoted={launch.tool.hasUpvoted}
                  initialDailyVotesRemaining={dailyVotesRemaining}
                  variant="compact"
                />
                <a
                  href={outboundHref ?? launch.tool.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  data-shipboost-outbound-source="launch_board"
                  data-shipboost-outbound-context="tool_listing"
                  data-shipboost-outbound-text={launch.tool.name}
                  data-shipboost-tool-id={launch.tool.id}
                  data-shipboost-tool-slug={launch.tool.slug}
                  data-shipboost-tool-name={launch.tool.name}
                  data-shipboost-tool-destination-type={
                    launch.tool.affiliateUrl ? "affiliate" : "website"
                  }
                  data-shipboost-tool-current-launch-type={launch.launchType}
                  data-shipboost-tool-is-featured={
                    launch.launchType === "FEATURED" ? "true" : undefined
                  }
                  className="rounded-full border border-border bg-background px-6 py-2.5 text-[10px] font-black  tracking-widest transition-all hover:bg-muted"
                >
                  Visit site
                </a>
              </div>
            </div>
          </article>
          );
        })}

        {launches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-5 py-12 text-center text-sm font-medium text-muted-foreground">
            No launches on this board yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}

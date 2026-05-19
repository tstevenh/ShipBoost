import { Fragment } from "react";
import Link from "next/link";

import { InlineProductAd } from "@/components/public/inline-product-ad";
import { InlineSponsorBanner } from "@/components/public/inline-sponsor-banner";
import { LaunchpadOpeningCountdown } from "@/components/public/launchpad-opening-countdown";
import { PublicDirectoryToolCard } from "@/components/public/public-directory-tool-card";
import { getCachedActiveSponsorPlacements } from "@/server/cache/public-content";
import type { PublicLaunchBoard } from "@/server/cache/public-content";
import type { LaunchBoardEntry } from "@/server/services/launch-service";

// Positions in the launchboard feed where inline ads get injected.
// Indexes are 0-based — `BANNER_AFTER_INDEX = 2` means the banner appears
// AFTER the 3rd launch row.
const BANNER_AFTER_INDEX = 2;
const PRODUCT_AD_AFTER_INDEXES = new Set([5, 8]);

const boardLabels: Record<PublicLaunchBoard, string> = {
  weekly: "This Week",
  monthly: "This Month",
  yearly: "This Year",
};

export async function LaunchpadShowcase({
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
  const [bannerPlacements, productAdPlacements] = await Promise.all([
    getCachedActiveSponsorPlacements("INLINE_BANNER"),
    getCachedActiveSponsorPlacements("INLINE_PRODUCT"),
  ]);

  const productAdIndexes = [...PRODUCT_AD_AFTER_INDEXES];

  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            Launch Pad &middot; {boardLabels[board]}
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-[26px]">
            {boardLabels[board]}&apos;s launches
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Live
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card [&>article:last-child]:border-b-0 [&>div:last-child]:border-b-0">
        {launches.map((launch, index) => {
          const productAdSlotIndex = productAdIndexes.indexOf(index);
          return (
            <Fragment key={launch.id}>
              <PublicDirectoryToolCard
                toolId={launch.tool.id}
                name={launch.tool.name}
                tagline={launch.tool.tagline}
                logoUrl={launch.tool.logoMedia?.url}
                websiteUrl={launch.tool.websiteUrl}
                affiliateUrl={launch.tool.affiliateUrl}
                slug={launch.tool.slug}
                votes={launch.tool.upvoteCount}
                primaryCategory={launch.tool.toolCategories[0]?.category ?? null}
                rank={index + 1}
                imagePriority={index < 3}
                isPremiumLaunch={launch.launchType === "FEATURED"}
              />
              {index === BANNER_AFTER_INDEX ? (
                <InlineSponsorBanner placement={bannerPlacements[0] ?? null} />
              ) : null}
              {productAdSlotIndex >= 0 ? (
                <InlineProductAd
                  placement={productAdPlacements[productAdSlotIndex] ?? null}
                />
              ) : null}
            </Fragment>
          );
        })}

        {launches.length === 0 &&
        emptyState === "prelaunch-countdown" &&
        launchpadGoLiveAt ? (
          <LaunchpadOpeningCountdown
            board={board}
            launchpadGoLiveAt={launchpadGoLiveAt}
          />
        ) : null}

        {launches.length === 0 && emptyState === "default" ? (
          <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
            <p className="text-xs font-medium text-muted-foreground">
              No launches found for this period.
            </p>
            <Link
              href="/submit"
              className="mt-4 text-sm font-semibold text-foreground transition-all hover:opacity-70"
            >
              Submit a product →
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

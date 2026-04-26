import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { JsonLdScript } from "@/components/seo/json-ld";
import { InternalLinkSection } from "@/components/seo/internal-link-section";
import { FilterBar } from "@/components/FilterBar";
import { LaunchpadShowcase } from "@/components/public/launchpad-showcase";
import { ShowcaseLayout } from "@/components/public/showcase-layout";
import { ViewerVoteStateProvider } from "@/components/public/viewer-vote-state-provider";
import { Footer } from "@/components/ui/footer";
import MinimalHero from "@/components/ui/hero-minimalism";
import { getEnv } from "@/server/env";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";
import { buildCollectionListingSchema } from "@/server/seo/page-schema";
import {
  getCachedLaunchBoard,
  getCachedPreviousWeeklyTopWinner,
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

function getLaunchBoardMetadata(board: "weekly" | "monthly" | "yearly"): Metadata {
  if (board === "monthly") {
    return buildPublicPageMetadata({
      title: "Monthly SaaS Launches | ShipBoost",
      description:
        "Explore this month's SaaS launches on ShipBoost and discover products gaining traction across the monthly board.",
      url: `/launches/${board}`,
    });
  }

  if (board === "yearly") {
    return buildPublicPageMetadata({
      title: "Yearly SaaS Launches | ShipBoost",
      description:
        "Browse the top SaaS launches of the year on ShipBoost and discover products with lasting momentum.",
      url: `/launches/${board}`,
    });
  }

  return buildPublicPageMetadata({
    title: "Weekly SaaS Launches | ShipBoost",
    description:
      "Browse this week's SaaS launches on ShipBoost. Discover new products, compare listings, and track the active weekly board.",
    url: `/launches/${board}`,
  });
}

export async function generateMetadata(
  context: RouteContext,
): Promise<Metadata> {
  const { board } = await context.params;

  if (!isPublicLaunchBoard(board)) {
    return {
      title: "Page not found | ShipBoost",
    };
  }

  return getLaunchBoardMetadata(board);
}

export default async function LaunchBoardPage(context: RouteContext) {
  const { board } = await context.params;
  const env = getEnv();

  if (!isPublicLaunchBoard(board)) {
    notFound();
  }

  const [launches, previousWeeklyTopWinner] = await Promise.all([
    getCachedLaunchBoard(board),
    getCachedPreviousWeeklyTopWinner(),
  ]);
  const toolIds = launches.map((launch) => launch.tool.id);
  const categoryMap = new Map<string, { name: string; slug: string; count: number }>();

  for (const launch of launches) {
    for (const item of launch.tool.toolCategories) {
      const current = categoryMap.get(item.category.slug);
      categoryMap.set(item.category.slug, {
        name: item.category.name,
        slug: item.category.slug,
        count: (current?.count ?? 0) + 1,
      });
    }
  }

  const topCategoryLinks = [...categoryMap.values()]
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 6)
    .map((item) => ({
      href: `/categories/${item.slug}`,
      label: item.name,
      description: `Browse ${item.name.toLowerCase()} tools connected to this board.`,
    }));
  const topCategoryNames = [...categoryMap.values()]
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 3)
    .map((item) => item.name);
  const topLaunchLinks = launches.slice(0, 4).map((launch) => ({
    href: `/tools/${launch.tool.slug}`,
    label: launch.tool.name,
    description: launch.tool.tagline,
  }));
  const boardTitle =
    board === "monthly"
      ? "Monthly launches"
      : board === "yearly"
        ? "Yearly launches"
        : "Weekly launches";
  const boardDescription =
    board === "monthly"
      ? "Monthly boards make it easier to see which products are building momentum beyond a single week."
      : board === "yearly"
        ? "Yearly boards give a broader view of which launches kept earning attention over time."
        : "Weekly boards are the core ShipBoost surface for launch visibility, ranking, and founder discovery.";
  const schema = buildCollectionListingSchema({
    name: `${board[0]?.toUpperCase()}${board.slice(1)} launches`,
    description: `Browse ${board} launches on ShipBoost.`,
    url: `${env.NEXT_PUBLIC_APP_URL}/launches/${board}`,
    items: launches.map((launch) => ({
      name: launch.tool.name,
      url: `${env.NEXT_PUBLIC_APP_URL}/tools/${launch.tool.slug}`,
    })),
  });

  return (
    <main className="flex-1">
      <JsonLdScript data={schema} />
      <MinimalHero />
      <Suspense
        fallback={<div className="h-[73px] border-b border-border bg-background" />}
      >
        <FilterBar launchpadGoLiveAt={env.LAUNCHPAD_GO_LIVE_AT} />
      </Suspense>
      <ViewerVoteStateProvider toolIds={toolIds}>
        <ShowcaseLayout isHomePage topWinner={previousWeeklyTopWinner}>
          <div className="space-y-12">
            <LaunchpadShowcase board={board} launches={launches} />
            <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
              <h2 className="text-3xl font-black tracking-tight text-foreground">
                {boardTitle}
              </h2>
              <p className="mt-4 max-w-3xl text-base font-medium leading-relaxed text-muted-foreground/80">
                {boardDescription}
              </p>
              <p className="mt-4 max-w-3xl text-base font-medium leading-relaxed text-muted-foreground/80">
                Use these boards to discover what is active now, then pivot into categories,
                tags, and alternatives pages when you want more focused comparisons.
              </p>
              {launches.length > 0 ? (
                <p className="mt-4 max-w-3xl text-base font-medium leading-relaxed text-muted-foreground/80">
                  This {board} board currently surfaces {launches.length} launch
                  {launches.length === 1 ? "" : "es"}
                  {topCategoryNames.length > 0
                    ? ` with especially strong overlap in ${topCategoryNames.join(", ")}.`
                    : "."}
                </p>
              ) : null}
            </section>
            <InternalLinkSection
              eyebrow="Launch Boards"
              title="Switch between ShipBoost board views"
              links={[
                {
                  href: "/launches/weekly",
                  label: "Weekly launches",
                  description: "See the active weekly cohort and leaderboard.",
                },
                {
                  href: "/launches/monthly",
                  label: "Monthly launches",
                  description: "Browse products gaining visibility over the month.",
                },
                {
                  href: "/launches/yearly",
                  label: "Yearly launches",
                  description: "Review launches with longer-term momentum.",
                },
              ]}
            />
            <InternalLinkSection
              eyebrow="Board Categories"
              title={`Categories showing up in the ${board} board`}
              links={topCategoryLinks}
            />
            <InternalLinkSection
              eyebrow="Board Picks"
              title={`Start with these ${board} launches`}
              links={topLaunchLinks}
            />
            <InternalLinkSection
              eyebrow="Next Steps"
              title="Useful paths after the launch board"
              links={[
                {
                  href: "/categories",
                  label: "Browse categories",
                  description: "Move from the board into product-area discovery.",
                },
                {
                  href: "/alternatives",
                  label: "Compare alternatives",
                  description: "Jump into direct comparison pages.",
                },
                {
                  href: "/launch-guide",
                  label: "Read the launch guide",
                  description: "Prepare your own product for launch day.",
                },
                {
                  href: "/submit",
                  label: "Submit your product",
                  description: "Start the founder submission flow.",
                },
              ]}
            />
          </div>
        </ShowcaseLayout>
      </ViewerVoteStateProvider>
      <Footer />
    </main>
  );
}

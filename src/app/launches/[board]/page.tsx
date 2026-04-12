import { notFound } from "next/navigation";
import { Suspense } from "react";

import { JsonLdScript } from "@/components/seo/json-ld";
import { FilterBar } from "@/components/FilterBar";
import { LaunchpadShowcase } from "@/components/public/launchpad-showcase";
import { ShowcaseLayout } from "@/components/public/showcase-layout";
import { ViewerVoteStateProvider } from "@/components/public/viewer-vote-state-provider";
import { Footer } from "@/components/ui/footer";
import MinimalHero from "@/components/ui/hero-minimalism";
import { getEnv } from "@/server/env";
import { buildCollectionListingSchema } from "@/server/seo/page-schema";
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
  const env = getEnv();

  if (!isPublicLaunchBoard(board)) {
    notFound();
  }

  const launches = await getCachedLaunchBoard(board);
  const toolIds = launches.map((launch) => launch.tool.id);
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
        <ShowcaseLayout isHomePage>
          <div className="space-y-12">
            <LaunchpadShowcase board={board} launches={launches} />
          </div>
        </ShowcaseLayout>
      </ViewerVoteStateProvider>
      <Footer />
    </main>
  );
}

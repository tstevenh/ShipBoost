import MinimalHero from "@/components/ui/hero-minimalism";
import { FilterBar } from "@/components/FilterBar";
import { Footer } from "@/components/ui/footer";
import { Suspense } from "react";
import { JsonLdScript } from "@/components/seo/json-ld";
import { ShowcaseLayout } from "@/components/public/showcase-layout";
import { LaunchpadShowcase } from "@/components/public/launchpad-showcase";
import { PrelaunchSurface } from "@/components/public/prelaunch-surface";
import { ViewerVoteStateProvider } from "@/components/public/viewer-vote-state-provider";
import { getEnv } from "@/server/env";
import { getCachedHomePageData } from "@/server/cache/public-content";
import { buildHomePageSchema } from "@/server/seo/page-schema";

export const revalidate = 300;

export default async function Home() {
  const env = getEnv();
  const isPrelaunch = env.NEXT_PUBLIC_PRELAUNCH_MODE === "true";
  const currentPeriod = "weekly";
  const { launches, prelaunchTools } = await getCachedHomePageData(currentPeriod, isPrelaunch);
  const schemaItems = isPrelaunch
    ? prelaunchTools.map((tool) => ({
        name: tool.name,
        url: `${env.NEXT_PUBLIC_APP_URL}/tools/${tool.slug}`,
      }))
    : launches.map((launch) => ({
        name: launch.tool.name,
        url: `${env.NEXT_PUBLIC_APP_URL}/tools/${launch.tool.slug}`,
      }));
  const homeSchema = buildHomePageSchema({
    title: "ShipBoost | Launch smarter. Get distributed.",
    description:
      "ShipBoost helps bootstrapped SaaS founders earn trust, visibility, and momentum through curated distribution.",
    url: env.NEXT_PUBLIC_APP_URL,
    items: schemaItems,
  });

  const launchToolIds = launches.map((launch) => launch.tool.id);

  return (
    <main className="flex-1">
      <JsonLdScript data={homeSchema} />
      {/* Full Width Hero */}
      <MinimalHero />
      
      {!isPrelaunch && (
        <Suspense fallback={<div className="h-[73px] border-b border-border bg-background" />}>
          <FilterBar launchpadGoLiveAt={env.LAUNCHPAD_GO_LIVE_AT} />
        </Suspense>
      )}
      
      <ViewerVoteStateProvider toolIds={launchToolIds}>
        <ShowcaseLayout isHomePage isPrelaunch={isPrelaunch}>
          <div className="space-y-10 min-h-[600px]">
            {isPrelaunch ? (
              <PrelaunchSurface tools={prelaunchTools} />
            ) : (
              <LaunchpadShowcase board={currentPeriod} launches={launches} />
            )}
          </div>
        </ShowcaseLayout>
      </ViewerVoteStateProvider>
      
      <Footer />
    </main>
  );
}

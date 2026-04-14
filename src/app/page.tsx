import type { Metadata } from "next";
import Link from "next/link";
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
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";

export const revalidate = 300;

export const metadata: Metadata = buildPublicPageMetadata({
  title: "ShipBoost | Weekly SaaS Launches and Discovery",
  description:
    "Discover weekly SaaS launches, curated tools, and founder-friendly distribution paths on ShipBoost.",
  url: "/",
  twitterCard: "summary_large_image",
});

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

            <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
              <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/60">
                Discovery
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                How founders use ShipBoost after launch day
              </h2>
              <div className="mt-6 space-y-4 text-base font-medium leading-relaxed text-muted-foreground/80">
                <p>
                  ShipBoost is designed to help founders do more than chase a one-day spike. The
                  weekly board makes launches easier to compare, while category, tag, and
                  alternatives pages keep good products discoverable after the board rotates.
                </p>
                <p>
                  For buyers and operators, that means cleaner discovery paths. For founders, it
                  means a public listing that stays useful after the initial launch window.
                </p>
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: "Launch visibility",
                    body: "Use weekly cohorts to stay visible longer and compete in a cleaner launch surface.",
                  },
                  {
                    title: "Category discovery",
                    body: "Keep showing up when users browse categories like marketing, development, support, and sales.",
                  },
                  {
                    title: "Comparison intent",
                    body: "Capture higher-intent traffic through alternatives pages and related tool discovery.",
                  },
                ].map((item) => (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-border bg-background p-5"
                  >
                    <h3 className="text-sm font-black text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
              <h2 className="text-3xl font-black tracking-tight text-foreground">
                Want to launch here?
              </h2>
              <p className="mt-4 max-w-3xl text-base font-medium leading-relaxed text-muted-foreground/80">
                Start with the submission flow if your product is ready, or review the launch
                options first if you are still deciding between Free Launch and Premium Launch.
              </p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm font-black">
                <Link href="/submit" className="text-foreground hover:underline underline-offset-4">
                  Submit your product
                </Link>
                <Link href="/pricing" className="text-foreground hover:underline underline-offset-4">
                  Compare launch pricing
                </Link>
                <Link href="/faqs" className="text-foreground hover:underline underline-offset-4">
                  Read founder FAQs
                </Link>
              </div>
            </div>
          </div>
        </ShowcaseLayout>
      </ViewerVoteStateProvider>
      
      <Footer />
    </main>
  );
}

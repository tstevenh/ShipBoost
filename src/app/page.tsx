import type { Metadata } from "next";
import Link from "next/link";
import MinimalHero from "@/components/ui/hero-minimalism";
import { FilterBar } from "@/components/FilterBar";
import { Footer } from "@/components/ui/footer";
import { Suspense } from "react";
import { JsonLdScript } from "@/components/seo/json-ld";
import {
  MobileSidebarFollowup,
  ShowcaseLayout,
} from "@/components/public/showcase-layout";
import { LaunchpadShowcase } from "@/components/public/launchpad-showcase";
import { ViewerVoteStateProvider } from "@/components/public/viewer-vote-state-provider";
import { getEnv } from "@/server/env";
import { getCachedHomePageData } from "@/server/cache/public-content";
import { buildHomePageSchema } from "@/server/seo/page-schema";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";

export const revalidate = 300;

export const metadata: Metadata = buildPublicPageMetadata({
  title: "ShipBoost | Launch once. Keep getting discovered.",
  description:
    "ShipBoost helps bootstrapped SaaS founders turn a launch into long-tail distribution with weekly launch boards, clean public listings, and discovery paths that outlive launch day.",
  url: "/",
  twitterCard: "summary_large_image",
});

export default async function Home() {
  const env = getEnv();
  const isPrelaunch = env.NEXT_PUBLIC_PRELAUNCH_MODE === "true";
  const currentPeriod = "weekly";
  const { launches, previousWeeklyTopWinner } =
    await getCachedHomePageData(currentPeriod, false);
  const schemaItems = launches.map((launch) => ({
    name: launch.tool.name,
    url: `${env.NEXT_PUBLIC_APP_URL}/tools/${launch.tool.slug}`,
  }));
  const homeSchema = buildHomePageSchema({
    title: "ShipBoost | Launch once. Keep getting discovered.",
    description:
      "ShipBoost helps bootstrapped SaaS founders turn a launch into long-tail distribution with weekly launch boards, founder-ready listings, and post-launch discovery paths.",
    url: env.NEXT_PUBLIC_APP_URL,
    items: schemaItems,
  });

  const launchToolIds = launches.map((launch) => launch.tool.id);

  return (
    <main className="flex-1">
      <JsonLdScript data={homeSchema} />
      {/* Full Width Hero */}
      <MinimalHero />
      
      <Suspense fallback={<div className="h-[73px] border-b border-border bg-background" />}>
        <FilterBar launchpadGoLiveAt={env.LAUNCHPAD_GO_LIVE_AT} />
      </Suspense>
      
      <ViewerVoteStateProvider toolIds={launchToolIds}>
        <ShowcaseLayout
          isHomePage
          topWinner={previousWeeklyTopWinner}
          showMobileFollowup={false}
        >
          <div className="space-y-10 min-h-[600px]">
            <LaunchpadShowcase
              board={currentPeriod}
              launches={launches}
              emptyState={isPrelaunch ? "prelaunch-countdown" : "default"}
              launchpadGoLiveAt={env.LAUNCHPAD_GO_LIVE_AT}
            />
            <MobileSidebarFollowup topWinner={previousWeeklyTopWinner} />

            <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
              <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/60">
                Why ShipBoost
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                Most launch sites give you a spike. Most directories give you a dead listing.
              </h2>
              <p className="mt-4 max-w-3xl text-base font-medium leading-relaxed text-muted-foreground/80">
                ShipBoost is built to do both jobs better: launch visibility now, and
                discoverability after the launch window ends.
              </p>
              <div className="mt-8 grid gap-4 lg:grid-cols-3">
                {[
                  {
                    title: "Daily launch feeds",
                    body: "Fast visibility, but strong products can get buried in a one-day reset before the right buyers ever see them.",
                  },
                  {
                    title: "Generic directories",
                    body: "Permanent listings help, but many become low-signal storage with weak context and weak discovery paths.",
                  },
                  {
                    title: "ShipBoost",
                    body: "Weekly launch visibility, cleaner public listings, and discovery surfaces that keep working through categories and alternatives.",
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

            <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
              <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/60">
                Founder outcomes
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                What founders get after launch
              </h2>
              <div className="mt-6 space-y-4 text-base font-medium leading-relaxed text-muted-foreground/80">
                <p>
                  ShipBoost is designed to help founders do more than chase a short-lived spike.
                  A launch becomes a public asset: something buyers can discover, compare, and
                  come back to after the launch week rotates.
                </p>
                <p>
                  For founders, that means clearer launch placement, a stronger public listing,
                  and discovery paths that keep working after the initial launch window ends.
                </p>
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: "Weekly board visibility",
                    body: "Launch into a cleaner weekly surface where products are easier to compare and less likely to disappear overnight.",
                  },
                  {
                    title: "Permanent public listing",
                    body: "Give your SaaS a founder-ready listing that stays useful after launch day instead of becoming dead archive furniture.",
                  },
                  {
                    title: "Long-tail discovery",
                    body: "Keep showing up through categories, tags, and alternatives pages when the right buyer is still searching later.",
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

            <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
              <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/60">
                See the system
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                The surfaces already doing the work
              </h2>
              <p className="mt-4 max-w-3xl text-base font-medium leading-relaxed text-muted-foreground/80">
                Even before ShipBoost has mature traffic proof, the product already has real
                surfaces founders can use and buyers can browse. That matters more than abstract
                positioning on its own.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {[
                  {
                    title: "Weekly board",
                    body: "Launch visibility in a cleaner cohort-based surface.",
                    href: "/launches/weekly",
                  },
                  {
                    title: "Categories",
                    body: "Discovery paths for buyers browsing by workflow and use case.",
                    href: "/categories",
                  },
                  {
                    title: "Alternatives",
                    body: "Comparison-driven pages built for higher-intent discovery.",
                    href: "/alternatives",
                  },
                  {
                    title: "Directories resource",
                    body: "A practical founder wedge tied directly to distribution planning.",
                    href: "/resources/startup-directories",
                  },
                  {
                    title: "Launch workflow",
                    body: "A clear path from submission to listing to launch timing.",
                    href: "/how-it-works",
                  },
                ].map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="rounded-2xl border border-border bg-background p-5 transition-colors hover:bg-muted/30"
                  >
                    <p className="text-xs font-black tracking-[0.18em] text-muted-foreground/60">
                      LIVE
                    </p>
                    <h3 className="mt-3 text-lg font-black tracking-tight text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
              <h2 className="text-3xl font-black tracking-tight text-foreground">
                Want to launch here?
              </h2>
              <p className="mt-4 max-w-3xl text-base font-medium leading-relaxed text-muted-foreground/80">
                Start with the submission flow if your product is ready. If you are still deciding,
                compare the launch options or browse the startup directories resource first.
              </p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm font-black">
                <Link href="/submit" className="text-foreground hover:underline underline-offset-4">
                  Submit your product
                </Link>
                <Link href="/pricing" className="text-foreground hover:underline underline-offset-4">
                  See launch pricing
                </Link>
                <Link
                  href="/resources/startup-directories"
                  className="text-foreground hover:underline underline-offset-4"
                >
                  Browse the startup directories resource
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

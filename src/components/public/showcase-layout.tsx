import Link from "next/link";
import { Suspense, type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Rocket } from "lucide-react";
import { DeferredHomeSearchModal } from "@/components/public/deferred-home-search-modal";
import { DeferredSidebarLeadMagnetForm } from "@/components/public/deferred-sidebar-lead-magnet-form";
import { DomainRatingBadge } from "@/components/public/domain-rating-badge";
import { SidebarSponsorPlacements } from "@/components/public/sidebar-sponsor-placements";
import {
  TopWinnerSidebarSpot,
  type TopWinnerSidebarSpotWinner,
} from "@/components/public/top-winner-sidebar-spot";
import {
  getCachedActiveSponsorPlacements,
  getCachedPreviousWeeklyTopWinner,
} from "@/server/cache/public-content";
import { getCachedSiteDomainRating } from "@/server/ahrefs";
import { StreakSidebar } from "@/components/streaks/streak-sidebar";

type SidebarSponsorPlacement = ComponentProps<
  typeof SidebarSponsorPlacements
>["placements"][number];

export function SidebarLeadMagnet() {
  return <DeferredSidebarLeadMagnetForm />;
}

function SidebarSubmitButton({ className }: { className?: string }) {
  return (
    <Link
      href="/submit"
      className={cn(
        "group flex w-full max-w-[250px] items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-[13px] font-semibold tracking-tight text-primary-foreground transition-all hover:opacity-90 active:scale-95",
        className,
      )}
    >
      <Rocket size={15} className="transition-transform group-hover:-translate-y-0.5" />
      Submit your product
    </Link>
  );
}

function MobileSidebarTopStack() {
  return (
    <div className="mb-6 grid gap-3 xl:hidden">
      <Suspense
        fallback={
          <div className="h-[42px] w-full rounded-xl border border-border bg-card" />
        }
      >
        <DeferredHomeSearchModal className="max-w-none" />
      </Suspense>
      <SidebarSubmitButton className="max-w-none" />
    </div>
  );
}

export async function MobileSidebarFollowup({
  topWinner,
  sponsorPlacements,
}: {
  topWinner?: TopWinnerSidebarSpotWinner | null;
  sponsorPlacements?: SidebarSponsorPlacement[];
}) {
  const resolvedSponsorPlacements =
    sponsorPlacements ?? (await getCachedActiveSponsorPlacements("SIDEBAR"));

  return (
    <div className="mt-6 grid gap-4 xl:hidden">
      <SidebarSponsorPlacements placements={resolvedSponsorPlacements} />
      <TopWinnerSidebarSpot winner={topWinner ?? null} className="max-w-none" />
      <DeferredSidebarLeadMagnetForm />
    </div>
  );
}

export async function ShowcaseLayout({
  children,
  isHomePage,
  isPrelaunch,
  topWinner,
  rightSidebarContent,
  showMobileFollowup = true,
}: {
  children: React.ReactNode;
  isHomePage?: boolean;
  isPrelaunch?: boolean;
  topWinner?: TopWinnerSidebarSpotWinner | null;
  rightSidebarContent?: React.ReactNode;
  showMobileFollowup?: boolean;
}) {
  const resolvedTopWinner =
    topWinner === undefined && !isPrelaunch
      ? await getCachedPreviousWeeklyTopWinner()
      : topWinner;
  const sponsorPlacements = !isPrelaunch
    ? await getCachedActiveSponsorPlacements("SIDEBAR")
    : [];
  const domainRating = await getCachedSiteDomainRating();

  return (
    <section className={cn("pb-20 bg-background min-h-screen", isHomePage ? "pt-0" : "pt-24")}>
      <div className="mx-auto w-full max-w-[1440px]">
        <div className={cn(
          "flex flex-col xl:flex-row xl:items-stretch",
          isPrelaunch && "block",
        )}>

          {/* Left Column: Search + Submit + DR Badge + Lead Magnet */}
          {!isPrelaunch && (
            <aside className={cn(
              "hidden xl:flex w-[275px] shrink-0 flex-col items-stretch gap-4 px-4 py-6",
              "sticky top-[80px] self-start",
              "max-h-[calc(100vh-80px)] overflow-y-auto overflow-x-hidden overscroll-contain",
              "[scrollbar-width:thin]",
            )}>
              <Suspense
                fallback={
                  <div className="h-[42px] w-full rounded-xl border border-border bg-card" />
                }
              >
                <DeferredHomeSearchModal className="max-w-none" />
              </Suspense>
              <SidebarSubmitButton className="max-w-none" />
              <DomainRatingBadge fullWidth value={domainRating} />
              <SidebarLeadMagnet />
              <StreakSidebar />
            </aside>
          )}

          {/* Middle Column: Launchboard */}
          <div className={cn(
            "min-w-0 flex-1",
            !isPrelaunch && "xl:border-x xl:border-border",
            isHomePage && "xl:pt-6",
            isPrelaunch && "max-w-5xl mx-auto w-full",
          )}>
            {!isPrelaunch ? <MobileSidebarTopStack /> : null}
            <div className={cn(!isPrelaunch && "px-4 xl:px-6 pb-8")}>
              {children}
            </div>
            {!isPrelaunch && showMobileFollowup ? (
              <MobileSidebarFollowup
                topWinner={resolvedTopWinner ?? null}
                sponsorPlacements={sponsorPlacements}
              />
            ) : null}
          </div>

          {/* Right Column: Sponsored + Top 1 Winner */}
          {!isPrelaunch && (
            <aside className={cn(
              "hidden xl:flex w-[350px] shrink-0 flex-col items-stretch gap-4 px-5 py-6",
              "sticky top-[80px] self-start h-fit",
            )}>
              <SidebarSponsorPlacements placements={sponsorPlacements} />
              <TopWinnerSidebarSpot winner={resolvedTopWinner ?? null} compactSlot />
              {rightSidebarContent}
            </aside>
          )}

        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Rocket } from "lucide-react";
import { DeferredHomeSearchModal } from "@/components/public/deferred-home-search-modal";
import { FrogDrBadge } from "@/components/public/frog-dr-badge";
import { SidebarLeadMagnetForm } from "@/components/public/sidebar-lead-magnet-form";
import { SidebarSponsorPlacements } from "@/components/public/sidebar-sponsor-placements";
import {
  TopWinnerSidebarSpot,
  type TopWinnerSidebarSpotWinner,
} from "@/components/public/top-winner-sidebar-spot";
import {
  getCachedActiveSponsorPlacements,
  getCachedPreviousWeeklyTopWinner,
} from "@/server/cache/public-content";

export function SidebarLeadMagnet() {
  return <SidebarLeadMagnetForm />;
}

function SidebarSubmitButton({ className }: { className?: string }) {
  return (
    <Link
      href="/submit"
      className={cn(
        "group flex w-full max-w-[250px] items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-black text-primary-foreground shadow-lg shadow-black/10 transition-all hover:opacity-90 active:scale-95",
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
      <DeferredHomeSearchModal className="max-w-none" />
      <SidebarSubmitButton className="max-w-none" />
      <FrogDrBadge fullWidth />
    </div>
  );
}

export function MobileSidebarFollowup({
  topWinner,
}: {
  topWinner?: TopWinnerSidebarSpotWinner | null;
}) {
  return (
    <div className="mt-6 grid gap-4 xl:hidden">
      <TopWinnerSidebarSpot winner={topWinner ?? null} className="max-w-none" />
      <SidebarLeadMagnetForm />
    </div>
  );
}

export async function ShowcaseLayout({
  children,
  isHomePage,
  isPrelaunch,
  topWinner,
  showMobileFollowup = true,
}: {
  children: React.ReactNode;
  isHomePage?: boolean;
  isPrelaunch?: boolean;
  topWinner?: TopWinnerSidebarSpotWinner | null;
  showMobileFollowup?: boolean;
}) {
  const resolvedTopWinner =
    topWinner === undefined && !isPrelaunch
      ? await getCachedPreviousWeeklyTopWinner()
      : topWinner;
  const sponsorPlacements = !isPrelaunch
    ? await getCachedActiveSponsorPlacements()
    : [];

  return (
    <section className={cn("pb-20 bg-muted/20 min-h-screen", isHomePage ? "pt-0" : "pt-24")}>
      <div className="mx-auto max-w-[1600px] px-6">
        <div className={cn(
          "grid grid-cols-1 gap-8 items-start",
          !isPrelaunch && "xl:grid-cols-[250px_minmax(0,1fr)_250px]"
        )}>
          
          {/* Left Column: Search + Submit + Lead Magnet */}
          {!isPrelaunch && (
            <aside className={cn(
              "hidden xl:flex flex-col items-center gap-3 sticky top-[100px] h-fit self-start pt-4",
            )}>
              <DeferredHomeSearchModal />
              <SidebarSubmitButton />
              <FrogDrBadge />
              <SidebarLeadMagnet />
            </aside>
          )}

          {/* Middle Column */}
          <div className={cn(
            "min-w-0",
            isHomePage && "pt-8",
            isPrelaunch && "max-w-5xl mx-auto w-full",
          )}>
            {!isPrelaunch ? <MobileSidebarTopStack /> : null}
            {children}
            {!isPrelaunch && showMobileFollowup ? (
              <MobileSidebarFollowup topWinner={resolvedTopWinner ?? null} />
            ) : null}
          </div>

          {/* Right Column: Sponsors + Top Winner */}
          {!isPrelaunch && (
            <aside className={cn(
              "hidden xl:flex flex-col items-center gap-3 sticky top-[100px] h-fit self-start pt-4",
            )}>
              <SidebarSponsorPlacements placements={sponsorPlacements} />
              <TopWinnerSidebarSpot winner={resolvedTopWinner ?? null} compactSlot />
            </aside>
          )}

        </div>
      </div>
    </section>
  );
}

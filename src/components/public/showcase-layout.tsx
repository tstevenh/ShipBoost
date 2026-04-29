import Link from "next/link";
import { cn } from "@/lib/utils";
import { Rocket } from "lucide-react";
import { DeferredHomeSearchModal } from "@/components/public/deferred-home-search-modal";
import { FrogDrBadge } from "@/components/public/frog-dr-badge";
import { SidebarLeadMagnetForm } from "@/components/public/sidebar-lead-magnet-form";
import {
  TopWinnerSidebarSpot,
  type TopWinnerSidebarSpotWinner,
} from "@/components/public/top-winner-sidebar-spot";
import { getCachedPreviousWeeklyTopWinner } from "@/server/cache/public-content";

export function SponsorSlot() {
  return null;
  /* return (
    <div className={cn("bg-card border border-border rounded-2xl p-5 shadow-sm", className)}>
      <h3 className="font-bold text-[9px]  tracking-[0.2em] text-muted-foreground/50 mb-3">
        Sponsored
      </h3>
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden border border-border flex items-center justify-center shrink-0 group cursor-pointer">
          <div className="w-full h-full bg-muted/50 flex items-center justify-center transition-transform group-hover:scale-110">
             <span className="text-muted-foreground/40 font-black text-[10px]">AD</span>
          </div>
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-xs truncate text-foreground">Boost your SaaS</h4>
          <p className="text-[10px] text-muted-foreground mt-1 leading-tight line-clamp-2">
            Reach thousands of founders and operators.
          </p>
        </div>
      </div>
    </div>
  ); */
}

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

  return (
    <section className={cn("pb-20 bg-muted/20 min-h-screen", isHomePage ? "pt-0" : "pt-24")}>
      <div className="mx-auto max-w-[1600px] px-6">
        <div className={cn(
          "grid grid-cols-1 gap-8 items-start",
          !isPrelaunch && "xl:grid-cols-[250px_minmax(0,1fr)_250px]"
        )}>
          
          {/* Left Column: Lead Magnet + Sponsors */}
          {!isPrelaunch && (
            <aside className={cn(
              "hidden xl:flex flex-col items-center gap-3 sticky top-[100px] h-fit self-start pt-4",
            )}>
              <SidebarLeadMagnet />
              <SponsorSlot />
              <SponsorSlot />
              <SponsorSlot />
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

          {/* Right Column: Search + Submit + Sponsors */}
          {!isPrelaunch && (
            <aside className={cn(
              "hidden xl:flex flex-col items-center gap-3 sticky top-[100px] h-fit self-start pt-4",
            )}>
              <DeferredHomeSearchModal />
              <SidebarSubmitButton />

              <FrogDrBadge />

              <TopWinnerSidebarSpot winner={resolvedTopWinner ?? null} />

              <SponsorSlot />
              <SponsorSlot />
              <SponsorSlot />
            </aside>
          )}

        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { Trophy, ExternalLink } from "lucide-react";

import { LogoFallback } from "@/components/ui/logo-fallback";
import { cn } from "@/lib/utils";

export type TopWinnerSidebarSpotWinner = {
  tool: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    websiteUrl: string;
    logoMedia: { url: string } | null;
    upvoteCount: number;
    toolCategories: Array<{
      category: { name: string; slug: string };
    }>;
  };
};

type TopWinnerSidebarSpotProps = {
  winner: TopWinnerSidebarSpotWinner | null;
  className?: string;
  compactSlot?: boolean;
};

export function TopWinnerSidebarSpot({
  winner,
  className,
  compactSlot = false,
}: TopWinnerSidebarSpotProps) {
  if (!winner) {
    if (compactSlot) {
      return (
        <section className={cn("w-full", className)}>
          <div className="overflow-hidden rounded-xl border border-amber-500/30 bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                TOP 1 WINNER
              </span>
              <Trophy size={13} className="text-amber-600" />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700">
                <Trophy size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold tracking-tight text-foreground">
                  Coming soon
                </h4>
                <p className="mt-0.5 line-clamp-2 text-[11px] font-normal leading-snug text-muted-foreground">
                  Last week&apos;s top product appears here.
                </p>
              </div>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className={cn("w-full space-y-2", className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            TOP 1 WINNER
          </h3>
          <span className="inline-flex items-center gap-1 text-[9px] font-medium tracking-tight text-amber-600">
            <Trophy size={11} />
            Weekly prize
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-amber-500/30 bg-card p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700">
              <Trophy size={16} />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold tracking-tight text-amber-700">
              #1
            </span>
          </div>

          <h4 className="mt-2.5 text-xs font-bold tracking-tight text-foreground">
            First winner coming soon
          </h4>
          <p className="mt-1.5 text-[11px] font-normal leading-relaxed text-muted-foreground">
            The top product from the completed weekly board will be featured here
            during the next launch cycle.
          </p>
        </div>
      </section>
    );
  }

  const primaryCategory = winner.tool.toolCategories[0]?.category ?? null;

  if (compactSlot) {
    return (
      <section className={cn("w-full", className)}>
        <Link
          href={`/tools/${winner.tool.slug}`}
          className="group block overflow-hidden rounded-xl border border-amber-500/30 bg-card p-4 transition-colors hover:bg-amber-500/[0.04]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-700">
              TOP 1 WINNER
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold tracking-tight text-amber-700">
              <Trophy size={10} />
              #1
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <LogoFallback
              name={winner.tool.name}
              src={winner.tool.logoMedia?.url}
              websiteUrl={winner.tool.websiteUrl}
              sizes="44px"
              className="h-11 w-11 shrink-0 rounded-lg border border-border/60"
              textClassName="text-sm"
            />
            <div className="min-w-0 flex-1">
              <h4 className="line-clamp-1 text-sm font-bold tracking-tight text-foreground">
                {winner.tool.name}
              </h4>
              <p className="mt-0.5 line-clamp-2 text-[11px] font-normal leading-snug text-muted-foreground">
                {winner.tool.tagline}
              </p>
              {primaryCategory ? (
                <p className="mt-1 truncate text-[9px] font-medium text-muted-foreground/50">
                  {primaryCategory.name}
                </p>
              ) : null}
            </div>
          </div>
        </Link>
      </section>
    );
  }

  return (
    <section className={cn("w-full space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          TOP 1 WINNER
        </h3>
        <span className="inline-flex items-center gap-1 text-[9px] font-medium tracking-tight text-amber-600">
          <Trophy size={11} />
          Last week
        </span>
      </div>

      <Link
        href={`/tools/${winner.tool.slug}`}
        className="group block overflow-hidden rounded-xl border border-amber-500/30 bg-card p-3.5 transition-colors hover:bg-amber-500/[0.04]"
      >
        <div className="flex items-start justify-between gap-3">
          <LogoFallback
            name={winner.tool.name}
            src={winner.tool.logoMedia?.url}
            websiteUrl={winner.tool.websiteUrl}
            sizes="40px"
            className="h-10 w-10 rounded-lg border border-border/60"
            textClassName="text-xs"
          />
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold tracking-tight text-amber-700">
            #1
          </span>
        </div>

        <h4 className="mt-2.5 line-clamp-1 text-xs font-bold tracking-tight text-foreground">
          {winner.tool.name}
        </h4>
        <p className="mt-1.5 line-clamp-2 text-[11px] font-normal leading-relaxed text-muted-foreground">
          {winner.tool.tagline}
        </p>

        <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-border pt-2.5">
          <div className="min-w-0">
            <p className="text-[9px] font-medium text-muted-foreground/60">
              {winner.tool.upvoteCount} vote{winner.tool.upvoteCount === 1 ? "" : "s"}
            </p>
            {primaryCategory ? (
              <p className="mt-1 truncate text-[9px] font-medium text-muted-foreground/50">
                {primaryCategory.name}
              </p>
            ) : null}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-[9px] font-semibold tracking-tight text-foreground transition-opacity group-hover:opacity-70">
            View launch
            <ExternalLink size={11} />
          </span>
        </div>
      </Link>
    </section>
  );
}
